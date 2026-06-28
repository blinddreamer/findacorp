package com.findacorp.collector.service;

import com.findacorp.collector.dto.esi.EsiCharacterInfo;
import com.findacorp.collector.dto.esi.EsiCorpHistoryEntry;
import com.findacorp.collector.dto.esi.EsiCorpInfo;
import com.findacorp.collector.dto.esi.EsiGroupInfo;
import com.findacorp.collector.dto.esi.EsiKillmailEntry;
import com.findacorp.collector.dto.esi.EsiSkillItem;
import com.findacorp.collector.dto.esi.EsiSkillQueueEntry;
import com.findacorp.collector.dto.esi.EsiSkillsResponse;
import com.findacorp.collector.dto.esi.EsiTypeInfo;
import com.findacorp.collector.dto.zkill.ZKillAttacker;
import com.findacorp.collector.dto.zkill.ZKillCharacterStats;
import com.findacorp.collector.dto.zkill.ZKillEntry;
import com.findacorp.collector.feign.AuthServiceClient;
import com.findacorp.collector.feign.EsiClient;
import com.findacorp.collector.feign.ZKillboardClient;
import com.findacorp.collector.util.IskFormat;
import com.findacorp.collector.util.TimezoneStats;
import com.findacorp.common.dto.CorpHistoryDto;
import com.findacorp.common.dto.KillEventDto;
import com.findacorp.common.dto.SkillDto;
import com.findacorp.common.events.PilotEnrichedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PilotEnrichmentService {

    private static final int MAX_KILLMAIL_FETCH = 100;

    private final EsiClient esiClient;
    private final ZKillboardClient zkillClient;
    private final AuthServiceClient authClient;
    private final EsiNameCacheService nameCache;

    public PilotEnrichedEvent enrich(Long characterId) {
        String bearer = "Bearer " + authClient.getEveAccessToken(characterId);

        // Pilot's own character info — refreshed each sync so renames and title changes propagate
        EsiCharacterInfo charInfo = esiClient.getCharacterInfo(characterId);
        String name = charInfo.getName() != null ? charInfo.getName() : nameCache.getCharacterName(characterId);
        String title = charInfo.getTitle() != null && !charInfo.getTitle().isBlank() ? charInfo.getTitle() : null;
        String eveBio = charInfo.getDescription() != null && !charInfo.getDescription().isBlank() ? charInfo.getDescription() : null;

        EsiSkillsResponse skillsResp = esiClient.getSkills(characterId, bearer);
        List<EsiCorpHistoryEntry> rawHistory = esiClient.getCorpHistory(characterId);

        // Lifetime stats from zkillboard stats API
        ZKillCharacterStats zkStats = fetchZKillStats(characterId);

        // Kill/loss pages for ISK sum and heatmap hash lookup
        List<ZKillEntry> kills = fetchZKill(() -> zkillClient.getKills(characterId));
        List<ZKillEntry> losses = fetchZKill(() -> zkillClient.getLosses(characterId));

        // Lifetime numbers: prefer stats API, fall back to page-1 counts
        int kbKills = zkStats != null && zkStats.getShipsDestroyed() != null
            ? zkStats.getShipsDestroyed() : kills.size();
        int kbLosses = zkStats != null && zkStats.getShipsLost() != null
            ? zkStats.getShipsLost() : losses.size();
        double kbEfficiency = (kbKills + kbLosses) == 0 ? 0.0
            : (double) kbKills / (kbKills + kbLosses) * 100.0;
        long iskDestroyed = zkStats != null && zkStats.getIskDestroyed() != null
            ? zkStats.getIskDestroyed()
            : kills.stream()
                .filter(k -> k.getZkb() != null && k.getZkb().getTotalValue() != null)
                .mapToLong(k -> k.getZkb().getTotalValue().longValue())
                .sum();

        // Fetch full killmail details from ESI (victim/attacker/time/system)
        List<EsiKillmailEntry> killDetails = fetchKillmailDetails(
            kills.stream().limit(MAX_KILLMAIL_FETCH).toList());
        List<EsiKillmailEntry> lossDetails = fetchKillmailDetails(
            losses.stream().limit(MAX_KILLMAIL_FETCH).toList());

        // Build ISK lookup map from zkill page data
        Map<Long, ZKillEntry> killById = indexById(kills);
        Map<Long, ZKillEntry> lossById = indexById(losses);

        List<SkillDto> skillDtos = buildSkillDtos(skillsResp);
        List<SkillDto> skillQueue = buildSkillQueue(characterId, bearer);
        List<KillEventDto> killHistory = buildKillHistory(characterId,
            killDetails, lossDetails, killById, lossById);
        List<CorpHistoryDto> corpHistory = buildCorpHistory(rawHistory);

        // Heatmap uses only the last 7 days of activity
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<EsiKillmailEntry> recentKills = killDetails.stream()
            .filter(km -> parseKillTime(km.getKillmailTime()).isAfter(sevenDaysAgo)).toList();
        List<EsiKillmailEntry> recentLosses = lossDetails.stream()
            .filter(km -> parseKillTime(km.getKillmailTime()).isAfter(sevenDaysAgo)).toList();
        int[][] heatmap = buildHeatmap(recentKills, recentLosses);

        String tz = TimezoneStats.detectTz(heatmap);
        List<Integer> tzActive = TimezoneStats.activeHours(heatmap);
        List<Integer> tzPeak = TimezoneStats.peakHours(heatmap, 5);

        Long totalSp = skillsResp.getTotalSp() != null ? skillsResp.getTotalSp() : 0L;

        return new PilotEnrichedEvent(
            characterId, name, title, eveBio, totalSp, spByCat(skillsResp),
            tz, tzActive, tzPeak, List.of("en"),
            kbKills, kbLosses, kbEfficiency, iskDestroyed,
            heatmap, skillDtos, skillQueue, killHistory, corpHistory,
            Instant.now()
        );
    }

    // ── Skill queue ──────────────────────────────────────────────────────────

    private List<SkillDto> buildSkillQueue(Long characterId, String bearer) {
        try {
            List<EsiSkillQueueEntry> queue = esiClient.getSkillQueue(characterId, bearer);
            if (queue == null) return List.of();
            return queue.stream()
                .filter(e -> e.getSkillId() != null && e.getFinishedLevel() != null)
                .sorted((a, b) -> Integer.compare(
                    a.getQueuePosition() != null ? a.getQueuePosition() : 999,
                    b.getQueuePosition() != null ? b.getQueuePosition() : 999))
                .limit(10)
                .map(e -> new SkillDto(
                    nameCache.getTypeInfo(e.getSkillId()).getName(),
                    e.getFinishedLevel(),
                    0L, null))
                .toList();
        } catch (Exception e) {
            log.debug("Skill queue fetch failed for {}: {}", characterId, e.getMessage());
            return List.of();
        }
    }

    // ── ESI killmail fetch ───────────────────────────────────────────────────

    private List<EsiKillmailEntry> fetchKillmailDetails(List<ZKillEntry> entries) {
        List<EsiKillmailEntry> result = new ArrayList<>();
        for (ZKillEntry entry : entries) {
            if (entry.getZkb() == null || entry.getZkb().getHash() == null
                    || entry.getKillmailId() == null) continue;
            try {
                EsiKillmailEntry km = esiClient.getKillmail(
                    entry.getKillmailId(), entry.getZkb().getHash());
                if (km != null) result.add(km);
            } catch (Exception e) {
                log.debug("ESI killmail fetch failed for {}: {}", entry.getKillmailId(), e.getMessage());
            }
        }
        return result;
    }

    // ── Kill history ─────────────────────────────────────────────────────────

    private List<KillEventDto> buildKillHistory(Long characterId,
                                                 List<EsiKillmailEntry> killDetails,
                                                 List<EsiKillmailEntry> lossDetails,
                                                 Map<Long, ZKillEntry> killById,
                                                 Map<Long, ZKillEntry> lossById) {
        List<KillEventDto> result = new ArrayList<>();

        for (EsiKillmailEntry km : killDetails) {
            Integer shipTypeId = getAttackerShipTypeId(km, characterId);
            String ship = resolveShipName(shipTypeId);
            String system = km.getSolarSystemId() != null
                ? nameCache.getSystemName(km.getSolarSystemId()) : "Unknown";
            ZKillEntry zkb = killById.get(km.getKillmailId());
            String isk = zkb != null && zkb.getZkb() != null && zkb.getZkb().getTotalValue() != null
                ? IskFormat.format(zkb.getZkb().getTotalValue()) : "0";
            Instant when = parseKillTime(km.getKillmailTime());
            boolean finalBlow = hasFinalBlow(km, characterId);
            String victimName = resolveVictimName(km.getVictim() != null
                ? km.getVictim().getCharacterId() : null);
            result.add(new KillEventDto("kill", ship, shipTypeId, system, isk, when, finalBlow, victimName));
        }

        for (EsiKillmailEntry km : lossDetails) {
            Integer shipTypeId = km.getVictim() != null ? km.getVictim().getShipTypeId() : null;
            String ship = shipTypeId != null ? resolveShipName(shipTypeId) : "Unknown";
            String system = km.getSolarSystemId() != null
                ? nameCache.getSystemName(km.getSolarSystemId()) : "Unknown";
            ZKillEntry zkb = lossById.get(km.getKillmailId());
            String isk = zkb != null && zkb.getZkb() != null && zkb.getZkb().getTotalValue() != null
                ? IskFormat.format(zkb.getZkb().getTotalValue()) : "0";
            Instant when = parseKillTime(km.getKillmailTime());
            String killerName = resolveFinalBlowName(km);
            result.add(new KillEventDto("loss", ship, shipTypeId, system, isk, when, false, killerName));
        }

        return result;
    }

    private String resolveVictimName(Long characterId) {
        if (characterId == null) return null;
        String name = nameCache.getCharacterName(characterId);
        return "Unknown".equals(name) ? null : name;
    }

    private String resolveFinalBlowName(EsiKillmailEntry km) {
        if (km.getAttackers() == null) return null;
        for (ZKillAttacker a : km.getAttackers()) {
            if (Boolean.TRUE.equals(a.getFinalBlow()) && a.getCharacterId() != null) {
                String name = nameCache.getCharacterName(a.getCharacterId());
                return "Unknown".equals(name) ? null : name;
            }
        }
        return null;
    }

    // ── Skill points ─────────────────────────────────────────────────────────

    private List<SkillDto> buildSkillDtos(EsiSkillsResponse resp) {
        if (resp.getSkills() == null) return List.of();
        List<SkillDto> result = new ArrayList<>();
        for (EsiSkillItem s : resp.getSkills()) {
            if (s.getSkillId() == null || s.getTrainedSkillLevel() == null) continue;
            EsiTypeInfo typeInfo = nameCache.getTypeInfo(s.getSkillId());
            String name = typeInfo.getName();
            long pts = s.getSkillpointsInSkill() != null ? s.getSkillpointsInSkill() : 0L;
            String category = null;
            try {
                category = nameCache.getGroupInfo(typeInfo.getGroupId()).getName();
            } catch (Exception ignored) {}
            result.add(new SkillDto(name, s.getTrainedSkillLevel(), pts, category));
        }
        return result;
    }

    private Map<String, Long> spByCat(EsiSkillsResponse resp) {
        if (resp.getSkills() == null) return Map.of();
        Map<String, Long> result = new HashMap<>();
        for (EsiSkillItem s : resp.getSkills()) {
            if (s.getSkillId() == null || s.getSkillpointsInSkill() == null) continue;
            try {
                EsiTypeInfo typeInfo = nameCache.getTypeInfo(s.getSkillId());
                EsiGroupInfo groupInfo = nameCache.getGroupInfo(typeInfo.getGroupId());
                result.merge(groupInfo.getName(), s.getSkillpointsInSkill(), Long::sum);
            } catch (Exception e) {
                result.merge("Other", s.getSkillpointsInSkill(), Long::sum);
            }
        }
        return result;
    }

    // ── Corp history ─────────────────────────────────────────────────────────

    private List<CorpHistoryDto> buildCorpHistory(List<EsiCorpHistoryEntry> entries) {
        List<EsiCorpHistoryEntry> sorted = entries.stream()
            .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
            .sorted((a, b) -> a.getStartDate().compareTo(b.getStartDate()))
            .toList();

        List<CorpHistoryDto> result = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            EsiCorpHistoryEntry entry = sorted.get(i);
            String fromDate = entry.getStartDate() != null
                ? entry.getStartDate().substring(0, 10) : "";
            String toDate = (i < sorted.size() - 1)
                ? sorted.get(i + 1).getStartDate().substring(0, 10) : "Present";

            EsiCorpInfo corpInfo = nameCache.getCorpInfo(entry.getCorporationId());
            String alliance = "";
            if (corpInfo.getAllianceId() != null) {
                alliance = nameCache.getAllianceInfo(corpInfo.getAllianceId()).getName();
            }
            result.add(new CorpHistoryDto(entry.getCorporationId(), fromDate, toDate,
                corpInfo.getName(), alliance, computeDuration(fromDate, toDate)));
        }
        java.util.Collections.reverse(result);
        return result;
    }

    // ── Heatmap (7-day window only) ───────────────────────────────────────────

    private int[][] buildHeatmap(List<EsiKillmailEntry> kills, List<EsiKillmailEntry> losses) {
        int[][] heatmap = new int[7][24];
        for (EsiKillmailEntry km : kills) addToHeatmap(heatmap, km.getKillmailTime());
        for (EsiKillmailEntry km : losses) addToHeatmap(heatmap, km.getKillmailTime());
        return heatmap;
    }

    private void addToHeatmap(int[][] heatmap, String killmailTime) {
        if (killmailTime == null) return;
        try {
            Instant instant = Instant.parse(killmailTime);
            LocalDateTime dt = LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
            int day = dt.getDayOfWeek().getValue() % 7;
            int hour = dt.getHour();
            heatmap[day][hour]++;
        } catch (Exception e) {
            // skip malformed timestamps
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<Long, ZKillEntry> indexById(List<ZKillEntry> entries) {
        Map<Long, ZKillEntry> map = new HashMap<>();
        for (ZKillEntry e : entries) {
            if (e.getKillmailId() != null) map.put(e.getKillmailId(), e);
        }
        return map;
    }

    private String resolveShipName(Integer typeId) {
        if (typeId == null) return "Unknown";
        return nameCache.getTypeInfo(typeId).getName();
    }

    private Integer getAttackerShipTypeId(EsiKillmailEntry km, Long characterId) {
        if (km.getAttackers() == null) return null;
        for (ZKillAttacker a : km.getAttackers()) {
            if (characterId.equals(a.getCharacterId())) return a.getShipTypeId();
        }
        return null;
    }

    private boolean hasFinalBlow(EsiKillmailEntry km, Long characterId) {
        if (km.getAttackers() == null) return false;
        for (ZKillAttacker a : km.getAttackers()) {
            if (characterId.equals(a.getCharacterId()) && Boolean.TRUE.equals(a.getFinalBlow())) return true;
        }
        return false;
    }

    private Instant parseKillTime(String killmailTime) {
        if (killmailTime == null) return Instant.EPOCH;
        try { return Instant.parse(killmailTime); } catch (Exception e) { return Instant.EPOCH; }
    }

    private String computeDuration(String from, String to) {
        if (from.isEmpty() || "Present".equals(to)) return "";
        try {
            var fromDate = java.time.LocalDate.parse(from, DateTimeFormatter.ISO_LOCAL_DATE);
            var toDate = java.time.LocalDate.parse(to, DateTimeFormatter.ISO_LOCAL_DATE);
            long months = ChronoUnit.MONTHS.between(fromDate, toDate);
            if (months >= 12) return (months / 12) + "y " + (months % 12) + "m";
            return months + "m";
        } catch (Exception e) { return ""; }
    }

    private ZKillCharacterStats fetchZKillStats(Long characterId) {
        try {
            ZKillCharacterStats stats = zkillClient.getCharacterStats(characterId);
            Thread.sleep(1000);
            return stats;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } catch (Exception e) {
            log.warn("zKillboard stats fetch failed for {}: {}", characterId, e.getMessage());
            return null;
        }
    }

    private List<ZKillEntry> fetchZKill(java.util.function.Supplier<List<ZKillEntry>> call) {
        try {
            List<ZKillEntry> result = call.get();
            Thread.sleep(1000);
            return result != null ? result : List.of();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (Exception e) {
            log.warn("zKillboard fetch failed: {}", e.getMessage());
            return List.of();
        }
    }
}
