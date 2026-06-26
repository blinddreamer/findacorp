package com.drydock.profile.service;

import com.drydock.common.events.CorpEnrichedEvent;
import com.drydock.profile.domain.Corp;
import com.drydock.profile.domain.CorpEnriched;
import com.drydock.profile.domain.CorpMember;
import com.drydock.profile.domain.CorpMemberEvent;
import com.drydock.profile.feign.NotificationClient;
import com.drydock.profile.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CorpServiceTest {

    @Mock CorpRepository corpRepository;
    @Mock CorpEnrichedRepository corpEnrichedRepository;
    @Mock CorpAllianceHistoryRepository allianceHistoryRepository;
    @Mock CorpMemberSnapshotRepository memberSnapshotRepository;
    @Mock CorpMemberRepository memberRepository;
    @Mock CorpMemberEventRepository memberEventRepository;
    @Mock NotificationClient notificationClient;
    @InjectMocks CorpService corpService;

    private CorpEnriched enrichedWithCeo(long corpId, Long ceoId) {
        CorpEnriched e = new CorpEnriched();
        e.setCorpId(corpId);
        e.setCeoId(ceoId);
        return e;
    }

    @Test
    void canEdit_trueForCeo() {
        when(corpEnrichedRepository.findById(1L)).thenReturn(Optional.of(enrichedWithCeo(1L, 100L)));
        assertThat(corpService.canEdit(1L, 100L)).isTrue();
    }

    @Test
    void canEdit_trueForAppointedHr() {
        when(corpEnrichedRepository.findById(1L)).thenReturn(Optional.empty());
        Corp c = new Corp();
        c.setCorpId(1L);
        c.setHrIds(List.of(200L, 201L));
        when(corpRepository.findById(1L)).thenReturn(Optional.of(c));
        assertThat(corpService.canEdit(1L, 201L)).isTrue();
    }

    @Test
    void canEdit_falseForOutsider() {
        when(corpEnrichedRepository.findById(1L)).thenReturn(Optional.empty());
        Corp c = new Corp();
        c.setCorpId(1L);
        c.setHrIds(List.of(200L));
        when(corpRepository.findById(1L)).thenReturn(Optional.of(c));
        assertThat(corpService.canEdit(1L, 999L)).isFalse();
    }

    @Test
    void canEdit_falseForNullCharacter() {
        assertThat(corpService.canEdit(1L, null)).isFalse();
    }

    @Test
    void isCeoKnown_trueOnlyWhenCeoIdPresent() {
        when(corpEnrichedRepository.findById(1L)).thenReturn(Optional.of(enrichedWithCeo(1L, 5L)));
        assertThat(corpService.isCeoKnown(1L)).isTrue();

        when(corpEnrichedRepository.findById(2L)).thenReturn(Optional.of(enrichedWithCeo(2L, null)));
        assertThat(corpService.isCeoKnown(2L)).isFalse();

        when(corpEnrichedRepository.findById(3L)).thenReturn(Optional.empty());
        assertThat(corpService.isCeoKnown(3L)).isFalse();
    }

    // ── upsertEnrichment: EVE Who roster diff → member events ──────────────────

    private static final Instant SYNCED_AT = Instant.parse("2026-06-20T10:00:00Z");

    /** Minimal enrichment event carrying only a roster (no snapshot/alliance/CEO churn). */
    private CorpEnrichedEvent rosterEvent(Long corpId, Map<Long, String> memberNames) {
        return new CorpEnrichedEvent(
            corpId, "Test Corp", "TEST",
            null, null, null, null, null, null,
            SYNCED_AT,
            null, null, null,
            memberNames
        );
    }

    private CorpMember member(Long corpId, Long charId, String name) {
        CorpMember m = new CorpMember();
        m.setCorpId(corpId);
        m.setCharacterId(charId);
        m.setCharacterName(name);
        return m;
    }

    @SuppressWarnings("unchecked")
    private List<CorpMemberEvent> captureSavedEvents() {
        ArgumentCaptor<List<CorpMemberEvent>> captor = ArgumentCaptor.forClass(List.class);
        verify(memberEventRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    @Test
    void upsertEnrichment_firstSync_seedsJoinedBaselineForAllMembers() {
        // previous roster is empty (mock default) → every member is a baseline joiner
        corpService.upsertEnrichment(rosterEvent(1L, Map.of(100L, "Alice", 200L, "Bob")));

        List<CorpMemberEvent> events = captureSavedEvents();
        assertThat(events).hasSize(2)
            .allSatisfy(e -> {
                assertThat(e.getEventType()).isEqualTo("JOINED");
                assertThat(e.getOccurredAt()).isEqualTo(LocalDateTime.ofInstant(SYNCED_AT, ZoneOffset.UTC));
            });
        assertThat(events).extracting(CorpMemberEvent::getCharacterId)
            .containsExactlyInAnyOrder(100L, 200L);
        verify(memberRepository).deleteByCorpId(1L);
    }

    @Test
    void upsertEnrichment_recordsJoinedForNewMemberOnly() {
        when(memberRepository.findByCorpIdOrderByCharacterNameAsc(1L))
            .thenReturn(List.of(member(1L, 100L, "Alice")));

        corpService.upsertEnrichment(rosterEvent(1L, Map.of(100L, "Alice", 300L, "Carol")));

        assertThat(captureSavedEvents()).singleElement().satisfies(e -> {
            assertThat(e.getEventType()).isEqualTo("JOINED");
            assertThat(e.getCharacterId()).isEqualTo(300L);
        });
    }

    @Test
    void upsertEnrichment_recordsLeftForDepartedMember() {
        when(memberRepository.findByCorpIdOrderByCharacterNameAsc(1L))
            .thenReturn(List.of(member(1L, 100L, "Alice"), member(1L, 200L, "Bob")));

        corpService.upsertEnrichment(rosterEvent(1L, Map.of(100L, "Alice")));

        assertThat(captureSavedEvents()).singleElement().satisfies(e -> {
            assertThat(e.getEventType()).isEqualTo("LEFT");
            assertThat(e.getCharacterId()).isEqualTo(200L);
        });
    }

    @Test
    void upsertEnrichment_nullRoster_skipsDiffAndLeavesRosterUntouched() {
        corpService.upsertEnrichment(rosterEvent(1L, null));

        verify(memberEventRepository, never()).saveAll(any());
        verify(memberRepository, never()).deleteByCorpId(any());
    }

    @Test
    void upsertEnrichment_emptyRoster_skipsDiff() {
        corpService.upsertEnrichment(rosterEvent(1L, Map.of()));

        verify(memberEventRepository, never()).saveAll(any());
        verify(memberRepository, never()).deleteByCorpId(any());
    }
}
