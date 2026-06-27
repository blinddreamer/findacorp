package com.findacorp.collector.job;

import com.findacorp.collector.domain.EntityType;
import com.findacorp.collector.domain.SyncLog;
import com.findacorp.collector.domain.SyncSource;
import com.findacorp.collector.domain.SyncStatus;
import com.findacorp.collector.domain.SyncTarget;
import com.findacorp.collector.messaging.EnrichmentPublisher;
import com.findacorp.collector.repository.SyncLogRepository;
import com.findacorp.collector.repository.SyncTargetRepository;
import com.findacorp.collector.service.CorpEnrichmentService;
import com.findacorp.common.events.CorpEnrichedEvent;
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
public class CorpSyncJob {

    private final SyncTargetRepository syncTargetRepo;
    private final SyncLogRepository syncLogRepo;
    private final CorpEnrichmentService enrichmentService;
    private final EnrichmentPublisher publisher;
    public static final String RUN_EVERY_5_MINUTES = "0 */5 * * * *";

   // @Scheduled(fixedDelayString = "${sync.corp.interval-ms:43200000}")
    @Scheduled(cron = RUN_EVERY_5_MINUTES, zone = "UTC")
    @CircuitBreaker(name = "esi", fallbackMethod = "onEsiFail")
    public void syncCorps() {
        List<SyncTarget> due = syncTargetRepo.findDueTargets(
            EntityType.CORP, LocalDateTime.now(), PageRequest.of(0, 50));

        log.info("Corp sync: {} targets due", due.size());

        for (SyncTarget target : due) {
            Long corpId = target.getId().getEntityId();
            target.setSyncStatus(SyncStatus.IN_PROGRESS);
            syncTargetRepo.save(target);

            try {
                CorpEnrichedEvent event = enrichmentService.enrich(corpId);
                publisher.publishCorpEnriched(event);

                target.setSyncStatus(SyncStatus.SUCCESS);
                target.setLastSyncAt(LocalDateTime.now());
                target.setNextSyncAt(LocalDateTime.now().plusHours(12));
                syncTargetRepo.save(target);

                logSync(corpId, SyncSource.ESI, true, null);
                log.info("Corp {} synced successfully", corpId);

            } catch (Exception e) {
                log.error("Corp {} sync failed: {}", corpId, e.getMessage());
                target.setSyncStatus(SyncStatus.FAILED);
                syncTargetRepo.save(target);
                logSync(corpId, SyncSource.ESI, false, e.getMessage());
            }
        }
    }

    public void onEsiFail(Throwable t) {
        log.warn("ESI circuit breaker open, skipping corp sync batch: {}", t.getMessage());
    }

    private void logSync(Long entityId, SyncSource source, boolean success, String errorMsg) {
        syncLogRepo.save(SyncLog.builder()
            .entityId(entityId)
            .entityType(EntityType.CORP)
            .syncedAt(LocalDateTime.now())
            .source(source)
            .success(success)
            .errorMsg(errorMsg)
            .build());
    }
}
