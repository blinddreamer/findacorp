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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
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
}
