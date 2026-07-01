package com.findacorp.auth.service;

import com.findacorp.auth.config.EveSsoProperties;
import com.findacorp.auth.domain.OauthState;
import com.findacorp.auth.domain.User;
import com.findacorp.auth.dto.EveCharacterInfo;
import com.findacorp.auth.dto.EveTokenResponse;
import com.findacorp.auth.feign.DataCollectorClient;
import com.findacorp.auth.feign.EveVerifyClient;
import com.findacorp.auth.repository.OauthStateRepository;
import com.findacorp.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final OauthStateRepository stateRepo;
    private final UserRepository userRepo;
    private final EveVerifyClient verifyClient;
    private final PkceService pkceService;
    private final JwtService jwtService;
    private final TokenEncryptionService encryption;
    private final EveSsoProperties ssoProps;
    private final DataCollectorClient dataCollector;
    private final com.findacorp.auth.feign.ProfileServiceClient profileService;

    private final RestClient ssoRestClient = RestClient.create();
    private final RestClient esiRestClient = RestClient.create();

    /** Scope required to send EVE in-game mail on a pilot's behalf. */
    private static final String MAIL_SCOPE = "esi-mail.send_mail.v1";

    @Value("${eve.esi.base-url:https://esi.evetech.net}")
    private String esiBaseUrl;

    /** Feature flag: when false, sending EVE mail is disabled platform-wide. Mirrors the UI's EVE_MAIL_ENABLED. */
    @Value("${app.eve-mail-enabled:true}")
    private boolean eveMailEnabled;

    private String basicAuth() {
        String credentials = ssoProps.clientId() + ":" + ssoProps.clientSecret();
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    private EveTokenResponse callTokenEndpoint(MultiValueMap<String, String> form) {
        return ssoRestClient.post()
            .uri(ssoProps.tokenUrl())
            .header(HttpHeaders.AUTHORIZATION, basicAuth())
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(EveTokenResponse.class);
    }

    public String buildLoginRedirectUrl() {
        String verifier = pkceService.generateCodeVerifier();
        String challenge = pkceService.computeCodeChallenge(verifier);
        String state = UUID.randomUUID().toString();

        stateRepo.save(OauthState.builder()
            .state(state)
            .codeVerifier(verifier)
            .redirectUri(ssoProps.callbackUrl())
            .createdAt(LocalDateTime.now())
            .build());

        return UriComponentsBuilder.fromUriString(ssoProps.authorizeUrl())
            .queryParam("response_type", "code")
            .queryParam("client_id", ssoProps.clientId())
            .queryParam("redirect_uri", ssoProps.callbackUrl())
            .queryParam("scope", ssoProps.scopes())
            .queryParam("state", state)
            .queryParam("code_challenge", challenge)
            .queryParam("code_challenge_method", "S256")
            .build(false)
            .toUriString();
    }

    public record CallbackResult(String accessJwt, String refreshJwt) {}

    @Transactional
    public CallbackResult handleCallback(String code, String state) {
        OauthState oauthState = stateRepo.findById(state)
            .orElseThrow(() -> new IllegalStateException("Invalid or expired OAuth state"));
        stateRepo.delete(oauthState);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", oauthState.getRedirectUri());
        form.add("code_verifier", oauthState.getCodeVerifier());
        EveTokenResponse tokens = callTokenEndpoint(form);

        EveCharacterInfo charInfo = verifyClient.verify("Bearer " + tokens.accessToken());

        User user = userRepo.findById(charInfo.characterId()).orElseGet(User::new);
        user.setCharacterId(charInfo.characterId());
        user.setCharacterName(charInfo.characterName());
        user.setAccessToken(encryption.encrypt(tokens.accessToken()));
        user.setRefreshToken(encryption.encrypt(tokens.refreshToken()));
        user.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokens.expiresIn()));
        user.setScopes(charInfo.scopes());
        user.setLastLogin(LocalDateTime.now());
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(LocalDateTime.now());
        }
        userRepo.save(user);

        String accessJwt = jwtService.issueAccess(charInfo.characterId(), charInfo.characterName());
        String refreshJwt = jwtService.issueRefresh(charInfo.characterId(), charInfo.characterName());

        long characterId = charInfo.characterId();
        CompletableFuture.runAsync(() -> {
            try {
                dataCollector.onLoginPilot(characterId);
            } catch (Exception e) {
                log.warn("Could not notify data-collector for pilot {}: {}", characterId, e.getMessage());
            }
        });

        return new CallbackResult(accessJwt, refreshJwt);
    }

    @Transactional
    public void deleteAccount(Long characterId) {
        userRepo.findById(characterId).ifPresent(user -> {
            user.setAccessToken(null);
            user.setRefreshToken(null);
            user.setTokenExpiresAt(null);
            userRepo.save(user);
        });

        CompletableFuture.runAsync(() -> {
            try { dataCollector.deletePilot(characterId); }
            catch (Exception e) { log.warn("Could not deregister pilot {} from data-collector: {}", characterId, e.getMessage()); }
        });

        CompletableFuture.runAsync(() -> {
            try { profileService.deletePilot(characterId); }
            catch (Exception e) { log.warn("Could not delete pilot {} profile: {}", characterId, e.getMessage()); }
        });
    }

    @Transactional
    public String getFreshEveToken(Long characterId) {
        User user = userRepo.findById(characterId)
            .orElseThrow(() -> new IllegalArgumentException("Character not found: " + characterId));

        if (user.getAccessToken() == null || user.getTokenExpiresAt() == null
            || LocalDateTime.now().plusMinutes(5).isAfter(user.getTokenExpiresAt())) {

            if (user.getRefreshToken() == null) {
                throw new IllegalArgumentException("EVE SSO token unavailable for character: " + characterId);
            }

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "refresh_token");
            form.add("refresh_token", encryption.decrypt(user.getRefreshToken()));

            EveTokenResponse fresh;
            try {
                fresh = callTokenEndpoint(form);
            } catch (Exception e) {
                // EVE SSO rejected the refresh — token expired or pilot revoked access
                log.warn("EVE SSO token refresh failed for character {}: {}", characterId, e.getMessage());
                throw new IllegalArgumentException("EVE SSO token unavailable for character: " + characterId);
            }

            user.setAccessToken(encryption.encrypt(fresh.accessToken()));
            user.setRefreshToken(encryption.encrypt(fresh.refreshToken()));
            user.setTokenExpiresAt(LocalDateTime.now().plusSeconds(fresh.expiresIn()));
            userRepo.save(user);
        }

        return encryption.decrypt(user.getAccessToken());
    }

    /**
     * Send a real EVE in-game mail from {@code senderId} to {@code recipientId} via ESI,
     * using the sender's EVE access token. Requires the sender to have granted the
     * {@value #MAIL_SCOPE} scope (i.e. logged in after it was added).
     */
    public void sendEveMail(Long senderId, Long recipientId, String subject, String body) {
        if (!eveMailEnabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "EVE mail sending is currently disabled.");
        }
        if (recipientId == null || subject == null || subject.isBlank() || body == null || body.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient, subject and body are required");
        }

        User sender = userRepo.findById(senderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown sender"));
        if (sender.getScopes() == null || !sender.getScopes().contains(MAIL_SCOPE)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "EVE mail permission not granted — log out and back in to enable sending EVE mails.");
        }

        String eveToken;
        try {
            eveToken = getFreshEveToken(senderId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Your EVE session has expired — log out and back in to send mail.");
        }

        Map<String, Object> payload = Map.of(
            "approved_cost", 0,
            "subject", subject,
            "body", body,
            "recipients", List.of(Map.of("recipient_id", recipientId, "recipient_type", "character"))
        );

        try {
            esiRestClient.post()
                .uri(esiBaseUrl + "/latest/characters/{id}/mail/?datasource=tranquility", senderId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + eveToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException e) {
            int status = e.getStatusCode().value();
            log.warn("EVE mail send failed (sender={}, recipient={}, status={}): {}",
                senderId, recipientId, status, e.getResponseBodyAsString());
            // 520 = EVE wants an ISK (CSPA) charge approved to mail this character.
            if (status == 520) {
                throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "EVE requires an ISK payment (CSPA charge) to mail this pilot, so the mail was not sent.");
            }
            if (status == 403) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "EVE rejected the mail — log out and back in to grant mail permission.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "EVE mail service error (" + status + "). Please try again later.");
        }
    }
}
