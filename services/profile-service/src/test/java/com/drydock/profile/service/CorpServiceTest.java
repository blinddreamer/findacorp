package com.drydock.profile.service;

import com.drydock.profile.domain.Corp;
import com.drydock.profile.domain.CorpEnriched;
import com.drydock.profile.feign.NotificationClient;
import com.drydock.profile.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
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
}
