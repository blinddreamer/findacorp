package com.findacorp.collector.service;

import com.findacorp.collector.dto.esi.EsiCorpAllianceEntry;
import com.findacorp.collector.dto.esi.EsiCorpInfo;
import com.findacorp.collector.dto.evewho.EveWhoCorpList;
import com.findacorp.collector.dto.zkill.ZKillCharacterStats;
import com.findacorp.collector.dto.zkill.ZKillEntry;
import com.findacorp.collector.feign.EsiClient;
import com.findacorp.collector.feign.EveWhoClient;
import com.findacorp.collector.feign.ZKillboardClient;
import com.findacorp.common.dto.AllianceHistoryDto;
import com.findacorp.common.events.CorpEnrichedEvent;
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
    private final EveWhoClient eveWhoClient;
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

        // Roster comes from EVE Who's public API — no EVE SSO scope or CEO token needed.
        // EVE Who carries no join dates, so member-change history is derived downstream by
        // diffing successive roster snapshots (see profile-service CorpService).
        Map<Long, String> memberNames = fetchMembersFromEveWho(corpId);

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
            memberNames
        );
    }

    // ── Member roster (EVE Who) ───────────────────────────────────────────────

    /**
     * characterId → name for the corp's current roster, from EVE Who's public API.
     * Returns {@code null} on failure or when EVE Who has no roster for the corp, so the
     * consumer skips the diff rather than wiping the stored roster on a transient blip.
     */
    private Map<Long, String> fetchMembersFromEveWho(Long corpId) {
        EveWhoCorpList list;
        try {
            list = eveWhoClient.getCorpList(corpId);
            Thread.sleep(1000); // be a good citizen — EVE Who expects low-rate access
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } catch (Exception e) {
            log.warn("EVE Who roster fetch failed for corp {}: {}", corpId, e.getMessage());
            return null;
        }
        if (list == null || list.getCharacters() == null || list.getCharacters().isEmpty()) {
            log.debug("EVE Who returned no roster for corp {}", corpId);
            return null;
        }
        return list.toMemberNames();
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
