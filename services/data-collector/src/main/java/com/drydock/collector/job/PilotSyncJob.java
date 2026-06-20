package com.drydock.collector.job;

import com.drydock.collector.domain.EntityType;
import com.drydock.collector.domain.SyncLog;
import com.drydock.collector.domain.SyncSource;
import com.drydock.collector.domain.SyncStatus;
import com.drydock.collector.domain.SyncTarget;
import com.drydock.collector.messaging.EnrichmentPublisher;
import com.drydock.collector.repository.SyncLogRepository;
import com.drydock.collector.repository.SyncTargetRepository;
import com.drydock.collector.service.PilotEnrichmentService;
import com.drydock.common.events.PilotEnrichedEvent;
import feign.FeignException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PilotSyncJob {

    private final SyncTargetRepository syncTargetRepo;
    private final SyncLogRepository syncLogRepo;
    private final PilotEnrichmentService enrichmentService;
    private final EnrichmentPublisher publisher;
    public static final String RUN_EVERY_5_MINUTES = "0 */5 * * * *";

    //@Scheduled(fixedDelayString = "${sync.pilot.interval-ms:21600000}")
    @Scheduled(cron = RUN_EVERY_5_MINUTES, zone = "UTC")
    @CircuitBreaker(name = "esi", fallbackMethod = "onEsiFail")
    public void syncPilots() {
        List<SyncTarget> due = syncTargetRepo.findDueTargets(
            EntityType.PILOT, LocalDateTime.now(), PageRequest.of(0, 50));

        log.info("Pilot sync: {} targets due", due.size());

        for (SyncTarget target : due) {
            Long charId = target.getId().getEntityId();
            target.setSyncStatus(SyncStatus.IN_PROGRESS);
            syncTargetRepo.save(target);

            try {
                PilotEnrichedEvent event = enrichmentService.enrich(charId);
                publisher.publishPilotEnriched(event);

                target.setSyncStatus(SyncStatus.SUCCESS);
                target.setLastSyncAt(LocalDateTime.now());
                target.setNextSyncAt(LocalDateTime.now().plusHours(6));
                syncTargetRepo.save(target);

                logSync(charId, SyncSource.ESI, true, null);
                log.info("Pilot {} synced successfully", charId);

            } catch (FeignException.NotFound e) {
                // Auth-service returned 404: EVE SSO token expired or pilot revoked access.
                // Back off to 7 days so we don't hammer the auth-service every 6 hours.
                log.warn("Pilot {} needs re-authentication (EVE SSO token unavailable), backing off 7 days", charId);
                target.setSyncStatus(SyncStatus.FAILED);
                target.setNextSyncAt(LocalDateTime.now().plusDays(7));
                syncTargetRepo.save(target);
                logSync(charId, SyncSource.ESI, false, "EVE SSO token unavailable - pilot must re-login");
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                log.error("Pilot {} sync failed: {}", charId, msg, e);
                target.setSyncStatus(SyncStatus.FAILED);
                syncTargetRepo.save(target);
                logSync(charId, SyncSource.ESI, false, msg);
            }
        }
    }

    public void onEsiFail(Throwable t) {
        log.warn("ESI circuit breaker open, skipping pilot sync batch: {}", t.getMessage());
    }

    private void logSync(Long entityId, SyncSource source, boolean success, String errorMsg) {
        syncLogRepo.save(SyncLog.builder()
            .entityId(entityId)
            .entityType(EntityType.PILOT)
            .syncedAt(LocalDateTime.now())
            .source(source)
            .success(success)
            .errorMsg(errorMsg)
            .build());
    }
}
