package com.findacorp.application.service;

import com.findacorp.application.domain.*;
import com.findacorp.application.dto.ThreadResponse;
import com.findacorp.application.dto.UpdateStatusRequest;
import com.findacorp.application.feign.ProfileServiceClient;
import com.findacorp.application.repository.MessageThreadRepository;
import com.findacorp.application.repository.ThreadMessageRepository;
import com.findacorp.application.repository.ThreadParticipantRepository;
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
class InboxServiceTest {

    @Mock MessageThreadRepository threadRepo;
    @Mock ThreadParticipantRepository participantRepo;
    @Mock ThreadMessageRepository messageRepo;
    @Mock ProfileServiceClient profileClient;
    @Mock InboxStreamService streamService;
    @InjectMocks InboxService service;

    private static final long THREAD_ID = 1L;
    private static final long CALLER_ID = 10L;

    private MessageThread applicationThread() {
        return MessageThread.builder()
                .type(ThreadType.APPLICATION)
                .direction(ApplicationDirection.PILOT_TO_CORP)
                .status(ApplicationStatus.SENT)
                .build();
    }

    private void callerIs(ParticipantSide side) {
        ThreadParticipant p = ThreadParticipant.builder()
                .threadId(THREAD_ID).characterId(CALLER_ID).side(side).build();
        when(participantRepo.findByThreadIdAndCharacterId(THREAD_ID, CALLER_ID))
                .thenReturn(Optional.of(p));
    }

    @Test
    void corpCanMarkApplicationUnderReview() {
        MessageThread thread = applicationThread();
        callerIs(ParticipantSide.CORP);
        when(threadRepo.findById(THREAD_ID)).thenReturn(Optional.of(thread));

        ThreadResponse res = service.updateStatus(
                THREAD_ID, CALLER_ID, new UpdateStatusRequest(ApplicationStatus.UNDER_REVIEW));

        assertThat(thread.getStatus()).isEqualTo(ApplicationStatus.UNDER_REVIEW);
        assertThat(res.status()).isEqualTo(ApplicationStatus.UNDER_REVIEW);
    }

    @Test
    void pilotCannotMarkApplicationUnderReview() {
        callerIs(ParticipantSide.PILOT);
        when(threadRepo.findById(THREAD_ID)).thenReturn(Optional.of(applicationThread()));

        assertThatThrownBy(() -> service.updateStatus(
                THREAD_ID, CALLER_ID, new UpdateStatusRequest(ApplicationStatus.UNDER_REVIEW)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode())
                        .isEqualTo(HttpStatus.FORBIDDEN));
    }
}
