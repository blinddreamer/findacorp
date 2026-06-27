package com.findacorp.profile.service;

import com.findacorp.profile.domain.Corp;
import com.findacorp.profile.domain.CorpEnriched;
import com.findacorp.profile.domain.Pilot;
import com.findacorp.profile.domain.PilotEnriched;
import com.findacorp.profile.dto.CorpSearchResult;
import com.findacorp.profile.dto.PilotSearchResult;
import com.findacorp.profile.repository.CorpEnrichedRepository;
import com.findacorp.profile.repository.CorpRepository;
import com.findacorp.profile.repository.PilotEnrichedRepository;
import com.findacorp.profile.repository.PilotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock PilotRepository pilotRepository;
    @Mock PilotEnrichedRepository pilotEnrichedRepository;
    @Mock CorpRepository corpRepository;
    @Mock CorpEnrichedRepository corpEnrichedRepository;
    @InjectMocks SearchService searchService;

    @Test
    void searchPilots_buildsJsonFiltersAndTzFlagThenMaps() {
        Pilot p = new Pilot();
        p.setCharacterId(1L);
        p.setName("Bob");
        when(pilotRepository.search(anyInt(), anyList(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of(p)));
        PilotEnriched e = new PilotEnriched();
        e.setCharacterId(1L);
        e.setSp(5_000_000L);
        when(pilotEnrichedRepository.findAllById(any())).thenReturn(List.of(e));

        Page<PilotSearchResult> result = searchService.searchPilots(
            List.of("EU"), 1_000_000L, 50.0, List.of("Logi", "DPS"), List.of("Sov"),
            null, "sp", PageRequest.of(0, 24));

        // TZ selected → flag 1 + IN-list; roles/content serialized to JSON arrays for JSON_OVERLAPS
        verify(pilotRepository).search(eq(1), eq(List.of("EU")), eq(1_000_000L), eq(50.0), isNull(),
            eq("[\"Logi\",\"DPS\"]"), eq("[\"Sov\"]"), eq("sp"), any(Pageable.class));
        assertThat(result.getContent()).singleElement().satisfies(r -> {
            assertThat(r.characterId()).isEqualTo(1L);
            assertThat(r.sp()).isEqualTo(5_000_000L);
        });
    }

    @Test
    void searchPilots_disablesTzAndJsonFiltersWhenEmpty() {
        when(pilotRepository.search(anyInt(), anyList(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of()));

        searchService.searchPilots(List.of(), null, null, List.of(), List.of(), null, "sp",
            PageRequest.of(0, 24));

        verify(pilotRepository).search(eq(0), eq(List.of("__none__")), isNull(), isNull(), isNull(),
            isNull(), isNull(), eq("sp"), any(Pageable.class));
    }

    @Test
    void searchCorps_defaultsStatusesToAllAndReadsDenormalizedColumns() {
        Corp c = new Corp();
        c.setCorpId(7L);
        c.setName("Goons");
        c.setTz("EU");
        c.setMinSp(10_000_000L);
        when(corpRepository.search(anyList(), any(), anyInt(), anyList(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of(c)));
        when(corpEnrichedRepository.findAllById(any())).thenReturn(List.of());

        Page<CorpSearchResult> result = searchService.searchCorps(
            null, null, null, null, "members", PageRequest.of(0, 24));

        verify(corpRepository).search(eq(List.of("open", "selective", "closed")), isNull(), eq(0),
            eq(List.of("__none__")), isNull(), eq("members"), any(Pageable.class));
        assertThat(result.getContent()).singleElement().satisfies(r -> {
            assertThat(r.corpId()).isEqualTo(7L);
            assertThat(r.tz()).isEqualTo("EU");
            assertThat(r.minSp()).isEqualTo(10_000_000L);
        });
    }

    @Test
    void searchCorps_parsesAndValidatesStatusList() {
        when(corpRepository.search(anyList(), any(), anyInt(), anyList(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of()));

        searchService.searchCorps(List.of("Sov"), "open,bogus,closed", List.of("EU"), 25_000_000L,
            "efficiency", PageRequest.of(0, 24));

        verify(corpRepository).search(eq(List.of("open", "closed")), eq("[\"Sov\"]"), eq(1),
            eq(List.of("EU")), eq(25_000_000L), eq("efficiency"), any(Pageable.class));
    }
}
