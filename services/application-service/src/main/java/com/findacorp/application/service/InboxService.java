package com.findacorp.application.service;

import com.findacorp.application.domain.*;
import com.findacorp.application.dto.*;
import com.findacorp.application.feign.ProfileServiceClient;
import com.findacorp.application.repository.MessageThreadRepository;
import com.findacorp.application.repository.ThreadMessageRepository;
import com.findacorp.application.repository.ThreadParticipantRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import com.findacorp.application.dto.InboxEvent;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class InboxService {

    private final MessageThreadRepository threadRepo;
    private final ThreadParticipantRepository participantRepo;
    private final ThreadMessageRepository messageRepo;
    private final ProfileServiceClient profileClient;
    private final InboxStreamService streamService;

    // ── Pilot → corp application ──────────────────────────────────────────────

    @Transactional
    public ThreadResponse createApplication(Long callerId, CreateApplicationRequest req) {
        if (req.corpId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "corpId is required");
        }
        if (req.message() == null || req.message().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message is required");
        }

        Long pilotId = callerId;
        Long corpId = req.corpId();
        CorpSummary corp = validateCorpExists(corpId);
        String pilotName = lookupPilotName(pilotId);

        boolean duplicate = threadRepo.existsByPilotIdAndCorpIdAndTypeAndDirectionAndStatusIn(
                pilotId, corpId, ThreadType.APPLICATION, ApplicationDirection.PILOT_TO_CORP,
                List.of(ApplicationStatus.SENT, ApplicationStatus.READ));
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An open application already exists for this pilot and corp");
        }

        MessageThread thread = threadRepo.save(MessageThread.builder()
                .type(ThreadType.APPLICATION)
                .direction(ApplicationDirection.PILOT_TO_CORP)
                .pilotId(pilotId)
                .corpId(corpId)
                .pilotName(pilotName)
                .corpName(corp.name())
                .corpTicker(corp.ticker())
                .status(ApplicationStatus.SENT)
                .build());

        // Pilot participant + corp side (CEO + HRs)
        participantRepo.save(participant(thread.getId(), pilotId, ParticipantSide.PILOT));
        addCorpParticipants(thread.getId(), corp);

        // Initial message is the application body, authored by the pilot
        postMessage(thread, pilotId, req.message());

        return toThreadResponse(thread, callerId);
    }

    // ── Direct message (recruiter → pilot) ────────────────────────────────────

    @Transactional
    public ThreadResponse createDirectMessage(Long callerId, CreateDirectRequest req) {
        if (req.pilotId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pilotId is required");
        }
        if (req.message() == null || req.message().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message is required");
        }
        if (req.pilotId().equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot message yourself");
        }

        String targetName = requirePilotName(req.pilotId());
        String senderName = lookupPilotName(callerId);

        // Continue an existing open DM between this sender and pilot instead of spawning a new one
        MessageThread existing = findOpenDirectThread(callerId, req.pilotId());
        if (existing != null) {
            postMessage(existing, callerId, req.message());
            participantRepo.findByThreadIdAndCharacterId(existing.getId(), callerId)
                    .ifPresent(p -> { p.setLastReadAt(LocalDateTime.now()); participantRepo.save(p); });
            return toThreadResponse(existing, callerId);
        }

        MessageThread thread = threadRepo.save(MessageThread.builder()
                .type(ThreadType.DIRECT)
                .direction(ApplicationDirection.CORP_TO_PILOT)
                .pilotId(req.pilotId())
                .pilotName(targetName)
                .corpName(senderName) // recruiter display name on the corp side
                .build());

        participantRepo.save(participant(thread.getId(), req.pilotId(), ParticipantSide.PILOT));
        participantRepo.save(participant(thread.getId(), callerId, ParticipantSide.CORP));
        postMessage(thread, callerId, req.message());

        return toThreadResponse(thread, callerId);
    }

    private MessageThread findOpenDirectThread(Long callerId, Long pilotId) {
        List<ThreadParticipant> mine = participantRepo.findByCharacterId(callerId);
        if (mine.isEmpty()) return null;
        List<Long> ids = mine.stream().map(ThreadParticipant::getThreadId).toList();
        return threadRepo.findByIdInOrderByUpdatedAtDesc(ids).stream()
                .filter(t -> t.getType() == ThreadType.DIRECT && pilotId.equals(t.getPilotId()))
                .findFirst().orElse(null);
    }

    // ── System notifications ──────────────────────────────────────────────────

    /** Opens a one-way SYSTEM thread in each recipient's inbox about a CEO change. */
    @Transactional
    public void createCeoChangeNotification(CeoChangeNotificationRequest req) {
        if (req.recipientIds() == null || req.recipientIds().isEmpty()) return;

        String corpName = req.corpName() != null ? req.corpName() : "Corp #" + req.corpId();
        String ceoName = req.newCeoName() != null ? req.newCeoName() : "a new CEO";
        String body = "Heads up — " + corpName + "'s CEO is now " + ceoName + ". "
                + "FINDACORP syncs the roster and member join history using the CEO's access, so please ask "
                + ceoName + " to sign in to FINDACORP to resume member sync.";

        MessageThread thread = threadRepo.save(MessageThread.builder()
                .type(ThreadType.SYSTEM)
                .corpId(req.corpId())
                .corpName(corpName)
                .subject("New CEO — action needed")
                .build());

        Set<Long> ids = new LinkedHashSet<>(req.recipientIds());
        for (Long id : ids) {
            participantRepo.save(participant(thread.getId(), id, ParticipantSide.CORP));
        }
        postMessage(thread, null, body); // null sender = system
    }

    // ── Inbox listing ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ThreadResponse> listThreads(Long callerId) {
        List<ThreadParticipant> mine = participantRepo.findByCharacterId(callerId);
        if (mine.isEmpty()) return List.of();
        List<Long> threadIds = mine.stream().map(ThreadParticipant::getThreadId).toList();
        return threadRepo.findByIdInOrderByUpdatedAtDesc(threadIds).stream()
                .map(t -> toThreadResponse(t, callerId))
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(Long callerId) {
        List<ThreadParticipant> mine = participantRepo.findByCharacterId(callerId);
        long count = mine.stream().filter(p -> isUnread(p, callerId)).count();
        return new UnreadCountResponse(count);
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    /** Returns the thread's messages and marks it read for the caller. */
    @Transactional
    public List<MessageResponse> getMessages(Long threadId, Long callerId) {
        ThreadParticipant me = requireParticipant(threadId, callerId);
        me.setLastReadAt(LocalDateTime.now());
        participantRepo.save(me);
        return messageRepo.findByThreadIdOrderBySentAtAsc(threadId).stream()
                .map(MessageResponse::from).toList();
    }

    @Transactional
    public MessageResponse sendMessage(Long threadId, Long callerId, SendMessageRequest req) {
        if (req.body() == null || req.body().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message body required");
        }
        ThreadParticipant me = requireParticipant(threadId, callerId);
        MessageThread thread = threadRepo.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        if (thread.getType() == ThreadType.SYSTEM) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot reply to a system notification");
        }
        if (thread.getStatus() == ApplicationStatus.ACCEPTED
                || thread.getStatus() == ApplicationStatus.REJECTED
                || thread.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot send a message on a closed application");
        }

        // Corp replying to a fresh application marks it READ
        if (thread.getType() == ThreadType.APPLICATION
                && thread.getStatus() == ApplicationStatus.SENT
                && me.getSide() == ParticipantSide.CORP) {
            thread.setStatus(ApplicationStatus.READ);
        }

        ThreadMessage saved = postMessage(thread, callerId, req.body());
        me.setLastReadAt(LocalDateTime.now());
        participantRepo.save(me);
        return MessageResponse.from(saved);
    }

    // ── Application status transitions ────────────────────────────────────────

    @Transactional
    public ThreadResponse updateStatus(Long threadId, Long callerId, UpdateStatusRequest req) {
        ThreadParticipant me = requireParticipant(threadId, callerId);
        MessageThread thread = threadRepo.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));
        if (thread.getType() != ThreadType.APPLICATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status only applies to application threads");
        }
        validateStatusTransition(me.getSide(), req.status());
        thread.setStatus(req.status());
        threadRepo.save(thread);
        notifyParticipants(thread.getId(), InboxEvent.status(thread.getId()));
        return toThreadResponse(thread, callerId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ThreadMessage postMessage(MessageThread thread, Long senderId, String body) {
        ThreadMessage msg = messageRepo.save(ThreadMessage.builder()
                .threadId(thread.getId())
                .senderId(senderId)
                .body(body)
                .build());
        // Bump the thread so it sorts to the top of inboxes
        thread.setUpdatedAt(LocalDateTime.now());
        threadRepo.save(thread);
        notifyParticipants(thread.getId(), InboxEvent.message(thread.getId()));
        return msg;
    }

    /**
     * Push an inbox event to every participant's live stream, after the current
     * transaction commits — so a client that reacts by refetching sees the write.
     * Falls back to an immediate publish when there is no active transaction.
     */
    private void notifyParticipants(Long threadId, InboxEvent event) {
        List<Long> ids = participantRepo.findByThreadId(threadId).stream()
                .map(ThreadParticipant::getCharacterId)
                .distinct()
                .toList();
        if (ids.isEmpty()) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { streamService.publish(ids, event); }
            });
        } else {
            streamService.publish(ids, event);
        }
    }

    private void addCorpParticipants(Long threadId, CorpSummary corp) {
        Set<Long> ids = new LinkedHashSet<>();
        if (corp.ceoId() != null) ids.add(corp.ceoId());
        if (corp.hrIds() != null) ids.addAll(corp.hrIds());
        if (ids.isEmpty()) {
            log.warn("Corp {} has no CEO/HR participants — application will be invisible to recruiters "
                    + "until the CEO logs in or HRs are appointed", corp.corpId());
        }
        for (Long cid : ids) {
            participantRepo.save(participant(threadId, cid, ParticipantSide.CORP));
        }
    }

    private ThreadParticipant participant(Long threadId, Long characterId, ParticipantSide side) {
        return ThreadParticipant.builder()
                .threadId(threadId).characterId(characterId).side(side).build();
    }

    private ThreadParticipant requireParticipant(Long threadId, Long callerId) {
        return participantRepo.findByThreadIdAndCharacterId(threadId, callerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant"));
    }

    private boolean isUnread(ThreadParticipant me, Long callerId) {
        ThreadMessage latest = messageRepo.findTopByThreadIdOrderBySentAtDesc(me.getThreadId());
        if (latest == null) return false;
        boolean newer = me.getLastReadAt() == null || latest.getSentAt().isAfter(me.getLastReadAt());
        // A message I authored is never unread to me (system messages have a null sender)
        return newer && !callerId.equals(latest.getSenderId());
    }

    private ThreadResponse toThreadResponse(MessageThread t, Long callerId) {
        ThreadParticipant me = participantRepo.findByThreadIdAndCharacterId(t.getId(), callerId).orElse(null);
        ThreadMessage latest = messageRepo.findTopByThreadIdOrderBySentAtDesc(t.getId());
        boolean unread = me != null && isUnread(me, callerId);
        return new ThreadResponse(
                t.getId(), t.getType(), t.getDirection(),
                t.getPilotId(), t.getPilotName(),
                t.getCorpId(), t.getCorpName(), t.getCorpTicker(),
                t.getSubject(), t.getStatus(),
                me != null ? me.getSide() : null,
                unread,
                latest != null ? latest.getBody() : null,
                latest != null ? latest.getSentAt() : null,
                t.getCreatedAt(), t.getUpdatedAt());
    }

    private void validateStatusTransition(ParticipantSide side, ApplicationStatus newStatus) {
        switch (newStatus) {
            case WITHDRAWN -> {
                if (side != ParticipantSide.PILOT) throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Only the pilot can withdraw an application");
            }
            case ACCEPTED, REJECTED, READ, UNDER_REVIEW -> {
                if (side != ParticipantSide.CORP) throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Only the corp can review, approve, reject, or mark as read");
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status transition to " + newStatus);
        }
    }

    private CorpSummary validateCorpExists(Long corpId) {
        try {
            return profileClient.getCorp(corpId);
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Corp " + corpId + " not found");
        } catch (FeignException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to validate corp — profile-service unavailable");
        }
    }

    private String lookupPilotName(Long pilotId) {
        try {
            PilotSummary pilot = profileClient.getPilot(pilotId);
            return pilot.name();
        } catch (FeignException e) {
            return null; // display-only
        }
    }

    /** Like {@link #lookupPilotName} but fails if the pilot isn't known to the platform. */
    private String requirePilotName(Long pilotId) {
        try {
            return profileClient.getPilot(pilotId).name();
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pilot " + pilotId + " not found");
        } catch (FeignException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to reach pilot — profile-service unavailable");
        }
    }
}
