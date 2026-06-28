package com.findacorp.profile.service;

import com.findacorp.profile.domain.Pilot;
import com.findacorp.profile.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PilotServiceTest {

    @Mock PilotRepository pilotRepository;
    @Mock PilotEnrichedRepository pilotEnrichedRepository;
    @Mock PilotSkillRepository pilotSkillRepository;
    @Mock PilotKillHistoryRepository killHistoryRepository;
    @Mock PilotCorpHistoryRepository corpHistoryRepository;
    @InjectMocks PilotService pilotService;

    private Pilot pilot(long id, boolean isPublic) {
        Pilot p = new Pilot();
        p.setCharacterId(id);
        p.setIsPublic(isPublic);
        return p;
    }

    @Test
    void getProfile_privatePilot_hiddenFromOthers() {
        when(pilotRepository.findById(1L)).thenReturn(Optional.of(pilot(1L, false)));
        assertThatThrownBy(() -> pilotService.getProfile(1L, 2L))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void getProfile_privatePilot_visibleToOwner() {
        when(pilotRepository.findById(1L)).thenReturn(Optional.of(pilot(1L, false)));

        var resp = pilotService.getProfile(1L, 1L);

        assertThat(resp.characterId()).isEqualTo(1L);
        assertThat(resp.isPublic()).isFalse();
    }

    @Test
    void getProfile_publicPilot_visibleToAnyone() {
        when(pilotRepository.findById(1L)).thenReturn(Optional.of(pilot(1L, true)));

        var resp = pilotService.getProfile(1L, 2L);

        assertThat(resp.characterId()).isEqualTo(1L);
    }

    @Test
    void getProfile_missingPilot_404() {
        when(pilotRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> pilotService.getProfile(1L, 1L))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
}
