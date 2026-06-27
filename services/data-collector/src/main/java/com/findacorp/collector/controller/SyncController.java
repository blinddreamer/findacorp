package com.findacorp.collector.controller;

import com.findacorp.collector.domain.EntityType;
import com.findacorp.collector.domain.SyncTarget;
import com.findacorp.collector.domain.SyncTargetId;
import com.findacorp.collector.messaging.EnrichmentPublisher;
import com.findacorp.collector.repository.SyncTargetRepository;
import com.findacorp.collector.service.CorpEnrichmentService;
import com.findacorp.collector.service.PilotEnrichmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/internal/sync")
@RequiredArgsConstructor
@Slf4j
public class SyncController {

    private final SyncTargetRepository syncTargetRepo;
    private final PilotEnrichmentService pilotService;
    private final CorpEnrichmentService corpService;
    private final EnrichmentPublisher publisher;

    @PostMapping("/pilot/{characterId}")
    public ResponseEntity<Map<String, String>> syncPilot(@PathVariable("characterId") Long characterId) {
        try {
            var event = pilotService.enrich(characterId);
            publisher.publishPilotEnriched(event);
            return ResponseEntity.ok(Map.of("status", "synced", "characterId", characterId.toString()));
        } catch (Exception e) {
            log.error("Manual pilot sync failed for {}: {}", characterId, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("status", "failed", "error", e.getMessage()));
        }
    }

    @PostMapping("/corp/{corpId}")
    public ResponseEntity<Map<String, String>> syncCorp(@PathVariable("corpId") Long corpId) {
        try {
            var event = corpService.enrich(corpId);
            publisher.publishCorpEnriched(event);
            return ResponseEntity.ok(Map.of("status", "synced", "corpId", corpId.toString()));
        } catch (Exception e) {
            log.error("Manual corp sync failed for {}: {}", corpId, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("status", "failed", "error", e.getMessage()));
        }
    }

    @PostMapping("/on-login/pilot/{characterId}")
    public ResponseEntity<Map<String, String>> onLoginPilot(@PathVariable("characterId") Long characterId) {
        SyncTargetId id = new SyncTargetId(characterId, EntityType.PILOT);
        SyncTarget target = syncTargetRepo.findById(id).orElseGet(() -> {
            SyncTarget t = new SyncTarget();
            t.setId(id);
            t.setNextSyncAt(LocalDateTime.now().plusHours(6));
            return syncTargetRepo.save(t);
        });

        if (target.getLastSyncAt() == null) {
            log.info("Pilot {} has no prior sync — triggering immediate enrichment", characterId);
            CompletableFuture.runAsync(() -> {
                try {
                    var event = pilotService.enrich(characterId);
                    publisher.publishPilotEnriched(event);
                    log.info("Immediate login sync completed for pilot {}", characterId);
                } catch (Exception e) {
                    log.error("Immediate login sync failed for pilot {}: {}", characterId, e.getMessage());
                }
            });
            return ResponseEntity.accepted().body(Map.of("status", "syncing", "characterId", characterId.toString()));
        }

        target.setNextSyncAt(LocalDateTime.now());
        syncTargetRepo.save(target);
        log.debug("Pilot {} already synced — queued for next scheduled run", characterId);
        return ResponseEntity.ok(Map.of("status", "queued", "characterId", characterId.toString()));
    }

    @PostMapping("/register/pilot/{characterId}")
    public ResponseEntity<Map<String, String>> registerPilot(@PathVariable("characterId") Long characterId) {
        SyncTargetId id = new SyncTargetId(characterId, EntityType.PILOT);
        if (!syncTargetRepo.existsById(id)) {
            SyncTarget target = new SyncTarget();
            target.setId(id);
            target.setNextSyncAt(LocalDateTime.now());
            syncTargetRepo.save(target);
        }
        return ResponseEntity.ok(Map.of("registered", characterId.toString()));
    }

    @DeleteMapping("/pilot/{characterId}")
    public ResponseEntity<Void> deletePilot(@PathVariable("characterId") Long characterId) {
        SyncTargetId id = new SyncTargetId(characterId, EntityType.PILOT);
        syncTargetRepo.deleteById(id);
        log.info("Pilot {} removed from sync targets", characterId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register/corp/{corpId}")
    public ResponseEntity<Map<String, String>> registerCorp(@PathVariable("corpId") Long corpId) {
        SyncTargetId id = new SyncTargetId(corpId, EntityType.CORP);
        if (!syncTargetRepo.existsById(id)) {
            SyncTarget target = new SyncTarget();
            target.setId(id);
            target.setNextSyncAt(LocalDateTime.now());
            syncTargetRepo.save(target);
        }
        return ResponseEntity.ok(Map.of("registered", corpId.toString()));
    }
}
