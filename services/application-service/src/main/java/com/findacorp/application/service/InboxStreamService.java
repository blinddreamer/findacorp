package com.findacorp.application.service;

import com.findacorp.application.dto.InboxEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-Sent Events fan-out for the inbox. Holds one or more open {@link SseEmitter}s
 * per connected character (a user may have multiple tabs open) and pushes small
 * {@link InboxEvent}s so the client can refetch the affected threads/messages.
 *
 * <p>State is in-memory and therefore per-instance: this works while application-service
 * runs as a single replica. Scaling to multiple replicas would need a shared bus
 * (e.g. the RabbitMQ already used elsewhere) to fan events across instances.
 */
@Service
@Slf4j
public class InboxStreamService {

    /** Generous timeout; the browser client (fetch-event-source) transparently reconnects. */
    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<Long, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /** Opens a stream for a character and registers cleanup on close/timeout/error. */
    public SseEmitter subscribe(Long characterId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.computeIfAbsent(characterId, k -> ConcurrentHashMap.newKeySet()).add(emitter);
        emitter.onCompletion(() -> remove(characterId, emitter));
        emitter.onTimeout(() -> { emitter.complete(); remove(characterId, emitter); });
        emitter.onError(e -> remove(characterId, emitter));
        try {
            // Initial event so the client knows the stream is live.
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            remove(characterId, emitter);
        }
        return emitter;
    }

    /** Push an event to every open stream of each given character. */
    public void publish(Collection<Long> characterIds, InboxEvent event) {
        for (Long id : characterIds) {
            Set<SseEmitter> set = emitters.get(id);
            if (set == null) continue;
            for (SseEmitter emitter : set) {
                try {
                    emitter.send(SseEmitter.event().name("inbox").data(event, MediaType.APPLICATION_JSON));
                } catch (Exception e) {
                    remove(id, emitter);
                }
            }
        }
    }

    /** Keeps idle connections alive through proxies and prunes dead emitters. */
    @Scheduled(fixedRate = 20_000)
    public void heartbeat() {
        emitters.forEach((id, set) -> set.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (Exception e) {
                remove(id, emitter);
            }
        }));
    }

    private void remove(Long characterId, SseEmitter emitter) {
        Set<SseEmitter> set = emitters.get(characterId);
        if (set != null) {
            set.remove(emitter);
            if (set.isEmpty()) emitters.remove(characterId);
        }
    }
}
