package com.drydock.collector.service;

import com.drydock.collector.dto.esi.EsiCorpAllianceEntry;
import com.drydock.collector.dto.esi.EsiCorpInfo;
import com.drydock.collector.dto.esi.EsiMemberTracking;
import com.drydock.collector.dto.esi.EsiNameResult;
import com.drydock.collector.dto.zkill.ZKillCharacterStats;
import com.drydock.collector.dto.zkill.ZKillEntry;
import com.drydock.collector.feign.AuthServiceClient;
import com.drydock.collector.feign.EsiClient;
import com.drydock.collector.feign.ZKillboardClient;
import com.drydock.common.dto.AllianceHistoryDto;
import com.drydock.common.events.CorpEnrichedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class CorpEnrichmentService {

    private final EsiClient esiClient;
    private final ZKillboardClient zkillClient;
    private final AuthServiceClient authClient;
    private final EsiNameCacheService nameCache;

    public CorpEnrichedEvent enrich(Long corpId) {
        EsiCorpInfo corp = esiClient.getCorpInfo(corpId);

        ZKillCharacterStats stats = fetchCorpStats(corpId);

        // Fallback to kill-page count when stats API doesn't return counts
        List<ZKillEntry> corpKills = List.of();
        List<ZKillEntry> corpLosses = List.of();
        if (stats == null || stats.getShipsDestroyed() == null) {
            corpKills  = fetchZKillList(() -> zkillClient.getCorpKills(corpId));
            corpLosses = fetchZKillList(() -> zkillClient.getCorpLosses(corpId));
        }

        int totalKills  = stats != null && stats.getShipsDestroyed() != null ? stats.getShipsDestroyed() : corpKills.size();
        int totalLosses = stats != null && stats.getShipsLost() != null ? stats.getShipsLost() : corpLosses.size();
        double efficiency = (totalKills + totalLosses) == 0 ? 0.0
            : (double) totalKills / (totalKills + totalLosses) * 100.0;

        String alliance = "";
        if (corp.getAllianceId() != null) {
            alliance = nameCache.getAllianceInfo(corp.getAllianceId()).getName();
        }

        int foundedYear = 0;
        if (corp.getDateFounded() != null && corp.getDateFounded().length() >= 4) {
            try {
                foundedYear = Integer.parseInt(corp.getDateFounded().substring(0, 4));
            } catch (NumberFormatException ignored) {}
        }

        List<AllianceHistoryDto> allianceHistory = fetchAllianceHistory(corpId);

        // Member data requires the CEO's (Director-role) token. Resolve it once and
        // reuse it for both the roster and the join-date (member-tracking) lookups.
        String ceoBearer = resolveCeoBearer(corp.getCeoId(), corpId);
        Map<Long, String> memberNames = ceoBearer != null ? fetchMemberNames(corpId, ceoBearer) : null;
        Map<Long, String> memberSince = ceoBearer != null ? fetchMemberSince(corpId, ceoBearer) : null;

        String ceoName = corp.getCeoId() != null ? nameCache.getCharacterName(corp.getCeoId()) : null;

        return new CorpEnrichedEvent(
            corpId,
            corp.getName(),
            corp.getTicker(),
            corp.getMemberCount(),
            null,
            alliance,
            foundedYear,
            totalKills,
            efficiency,
            Instant.now(),
            corp.getCeoId(),
            ceoName,
            allianceHistory,
            memberNames,
            memberSince
        );
    }

    // ── Member roster ─────────────────────────────────────────────────────────

    private String resolveCeoBearer(Long ceoId, Long corpId) {
        if (ceoId == null) return null;
        try {
            return "Bearer " + authClient.getEveAccessToken(ceoId);
        } catch (Exception e) {
            log.debug("CEO {} token unavailable for corp {} member fetch: {}", ceoId, corpId, e.getMessage());
            return null;
        }
    }

    /** characterId → corp join date (ESI start_date). Empty if the scope/role is missing. */
    private Map<Long, String> fetchMemberSince(Long corpId, String bearer) {
        List<EsiMemberTracking> tracking;
        try {
            tracking = esiClient.getCorpMemberTracking(corpId, bearer);
        } catch (Exception e) {
            // Most likely the CEO hasn't re-authed with esi-corporations.track_members.v1 yet.
            log.debug("Member tracking unavailable for corp {}: {}", corpId, e.getMessage());
            return Map.of();
        }
        if (tracking == null) return Map.of();
        Map<Long, String> since = new HashMap<>();
        for (EsiMemberTracking t : tracking) {
            if (t.getCharacterId() != null && t.getStartDate() != null) {
                since.put(t.getCharacterId(), t.getStartDate());
            }
        }
        return since;
    }

    private Map<Long, String> fetchMemberNames(Long corpId, String bearer) {
        List<Long> memberIds;
        try {
            memberIds = esiClient.getCorpMembers(corpId, bearer);
        } catch (Exception e) {
            log.warn("Could not fetch corp members for {}: {}", corpId, e.getMessage());
            return null;
        }
        if (memberIds == null || memberIds.isEmpty()) return Map.of();

        Map<Long, String> names = new HashMap<>();
        for (int i = 0; i < memberIds.size(); i += 1000) {
            List<Long> batch = memberIds.subList(i, Math.min(i + 1000, memberIds.size()));
            try {
                List<EsiNameResult> results = esiClient.getUniverseNames(batch);
                if (results != null) {
                    for (EsiNameResult r : results) {
                        if (r.getId() != null && r.getName() != null) {
                            names.put(r.getId(), r.getName());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Name resolution batch failed for corp {}: {}", corpId, e.getMessage());
            }
        }
        return names;
    }

    // ── zKillboard stats ──────────────────────────────────────────────────────

    private ZKillCharacterStats fetchCorpStats(Long corpId) {
        try {
            ZKillCharacterStats stats = zkillClient.getCorpStats(corpId);
            Thread.sleep(1000);
            return stats;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } catch (Exception e) {
            log.warn("zKillboard corp stats fetch failed for {}: {}", corpId, e.getMessage());
            return null;
        }
    }

    // ── zKillboard kill list ──────────────────────────────────────────────────

    private List<ZKillEntry> fetchZKillList(Supplier<List<ZKillEntry>> call) {
        try {
            List<ZKillEntry> result = call.get();
            Thread.sleep(1000);
            return result != null ? result : List.of();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (Exception e) {
            log.warn("zKillboard list fetch failed: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Alliance history ──────────────────────────────────────────────────────

    private List<AllianceHistoryDto> fetchAllianceHistory(Long corpId) {
        List<EsiCorpAllianceEntry> raw;
        try {
            raw = esiClient.getCorpAllianceHistory(corpId);
        } catch (Exception e) {
            log.warn("Could not fetch alliance history for corp {}: {}", corpId, e.getMessage());
            return List.of();
        }
        if (raw == null || raw.isEmpty()) return List.of();

        List<EsiCorpAllianceEntry> sorted = raw.stream()
            .filter(e -> e.getStartDate() != null)
            .sorted((a, b) -> a.getStartDate().compareTo(b.getStartDate()))
            .toList();

        Map<Integer, String> endDateByRecordId = new HashMap<>();
        for (int i = 0; i < sorted.size() - 1; i++) {
            endDateByRecordId.put(sorted.get(i).getRecordId(), sorted.get(i + 1).getStartDate());
        }

        List<AllianceHistoryDto> result = new ArrayList<>();
        for (EsiCorpAllianceEntry entry : sorted) {
            if (entry.getAllianceId() == null) continue;
            String endDate = endDateByRecordId.get(entry.getRecordId());
            String allianceName = "";
            try {
                allianceName = nameCache.getAllianceInfo(entry.getAllianceId()).getName();
            } catch (Exception ignored) {}
            result.add(new AllianceHistoryDto(
                entry.getAllianceId(),
                allianceName,
                entry.getStartDate().substring(0, 10),
                endDate != null ? endDate.substring(0, 10) : null
            ));
        }
        Collections.reverse(result);
        return result;
    }
}
