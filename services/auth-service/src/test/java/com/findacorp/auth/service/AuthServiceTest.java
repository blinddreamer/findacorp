package com.findacorp.auth.service;

import com.findacorp.auth.config.EveSsoProperties;
import com.findacorp.auth.domain.User;
import com.findacorp.auth.feign.DataCollectorClient;
import com.findacorp.auth.feign.EveVerifyClient;
import com.findacorp.auth.feign.ProfileServiceClient;
import com.findacorp.auth.repository.OauthStateRepository;
import com.findacorp.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock OauthStateRepository stateRepo;
    @Mock UserRepository userRepo;
    @Mock EveVerifyClient verifyClient;
    @Mock PkceService pkceService;
    @Mock JwtService jwtService;
    @Mock TokenEncryptionService encryption;
    @Mock EveSsoProperties ssoProps;
    @Mock DataCollectorClient dataCollector;
    @Mock ProfileServiceClient profileService;
    @InjectMocks AuthService authService;

    @BeforeEach
    void enableEveMailByDefault() {
        // @InjectMocks leaves the @Value primitive boolean as false; enable it so the
        // existing tests exercise the mail flow rather than the disabled short-circuit.
        ReflectionTestUtils.setField(authService, "eveMailEnabled", true);
    }

    private User userWithScopes(long id, String scopes) {
        User u = new User();
        u.setCharacterId(id);
        u.setScopes(scopes);
        return u;
    }

    private void assertStatus(ResponseStatusException e, HttpStatus expected) {
        assertThat(e.getStatusCode()).isEqualTo(expected);
    }

    @Test
    void sendEveMail_rejectsBlankInput() {
        assertThatThrownBy(() -> authService.sendEveMail(1L, 2L, "  ", "body"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertStatus((ResponseStatusException) e, HttpStatus.BAD_REQUEST));
    }

    @Test
    void sendEveMail_unknownSender_401() {
        when(userRepo.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.sendEveMail(1L, 2L, "Hi", "Body"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertStatus((ResponseStatusException) e, HttpStatus.UNAUTHORIZED));
    }

    @Test
    void sendEveMail_featureDisabled_503() {
        ReflectionTestUtils.setField(authService, "eveMailEnabled", false);
        assertThatThrownBy(() -> authService.sendEveMail(1L, 2L, "Hi", "Body"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertStatus((ResponseStatusException) e, HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    void sendEveMail_missingMailScope_403() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(userWithScopes(1L, "publicData esi-skills.read_skills.v1")));
        assertThatThrownBy(() -> authService.sendEveMail(1L, 2L, "Hi", "Body"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertStatus((ResponseStatusException) e, HttpStatus.FORBIDDEN));
    }
}
