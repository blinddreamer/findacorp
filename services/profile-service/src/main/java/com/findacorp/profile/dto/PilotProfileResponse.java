package com.findacorp.profile.dto;

import com.findacorp.profile.domain.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public record PilotProfileResponse(
    Long characterId,
    String name,
    String bio,
    String lookingFor,
    List<String> roles,
    List<String> content,
    String activity,
    String voice,
    Boolean verified,
    List<Integer> manualTzActive,
    List<String> languages,
    Boolean isPublic,
    // enriched fields (nullable)
    String title,
    String eveBio,
    Long sp,
    Map<String, Long> spByCat,
    String tz,
    List<Integer> tzActive,
    List<Integer> tzPeak,
    List<String> lang,
    Integer kbKills,
    Integer kbLosses,
    BigDecimal kbEfficiency,
    Long iskDestroyed,
    int[][] heatmap,
    LocalDateTime lastSyncedAt,
    // detail lists
    List<SkillEntry> skills,
    List<SkillEntry> skillQueue,
    List<RecentSkillEntry> recentSkills,
    List<KillEntry> killHistory,
    List<CorpHistoryEntry> corpHistory
) {
    public record SkillEntry(String skillName, int level, long points, String category) {}

    public record RecentSkillEntry(String skillName, int level, LocalDateTime learnedAt) {}

    public record KillEntry(String kind, String ship, Integer shipTypeId, String system, String isk,
                            LocalDateTime whenAt, boolean finalBlow, String victimName) {}

    public record CorpHistoryEntry(Long corpId, String corpName, String alliance,
                                   String fromDate, String toDate, String durationLabel) {}

    private static List<SkillEntry> parseSkillQueue(List<String> raw) {
        if (raw == null) return List.of();
        return raw.stream().map(s -> {
            int colon = s.lastIndexOf(':');
            if (colon < 0) return new SkillEntry(s, 0, 0L, null);
            try {
                String name = s.substring(0, colon);
                int level = Integer.parseInt(s.substring(colon + 1));
                return new SkillEntry(name, level, 0L, null);
            } catch (NumberFormatException e) {
                return new SkillEntry(s, 0, 0L, null);
            }
        }).toList();
    }

    public static PilotProfileResponse from(Pilot pilot, PilotEnriched enriched,
                                             List<PilotSkill> skills,
                                             List<PilotKillHistory> kills,
                                             List<PilotCorpHistory> history) {
        List<SkillEntry> skillEntries = skills.stream()
            .map(s -> new SkillEntry(s.getSkillName(), s.getLevel(), s.getPoints(), s.getCategory()))
            .toList();

        List<RecentSkillEntry> recentSkillEntries = skills.stream()
            .filter(s -> s.getLearnedAt() != null)
            .sorted(Comparator.comparing(PilotSkill::getLearnedAt).reversed())
            .limit(10)
            .map(s -> new RecentSkillEntry(s.getSkillName(), s.getLevel(), s.getLearnedAt()))
            .toList();

        List<KillEntry> killEntries = kills.stream()
            .map(k -> new KillEntry(k.getKind(), k.getShip(), k.getShipTypeId(), k.getSystem(),
                                    k.getIsk(), k.getWhenAt(), Boolean.TRUE.equals(k.getFinalBlow()),
                                    k.getVictimName()))
            .toList();

        List<CorpHistoryEntry> historyEntries = history.stream()
            .map(h -> new CorpHistoryEntry(h.getCorpId(), h.getCorpName(), h.getAlliance(),
                                            h.getFromDate(), h.getToDate(), h.getDurationLabel()))
            .toList();

        if (enriched == null) {
            return new PilotProfileResponse(
                pilot.getCharacterId(), pilot.getName(), pilot.getBio(), pilot.getLookingFor(),
                pilot.getRoles(), pilot.getContent(), pilot.getActivity(), pilot.getVoice(),
                pilot.getVerified(), pilot.getManualTzActive(), pilot.getLanguages(), pilot.getIsPublic(),
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                skillEntries, List.of(), recentSkillEntries, killEntries, historyEntries
            );
        }

        List<SkillEntry> queueEntries = parseSkillQueue(enriched.getSkillQueue());

        return new PilotProfileResponse(
            pilot.getCharacterId(), pilot.getName(), pilot.getBio(), pilot.getLookingFor(),
            pilot.getRoles(), pilot.getContent(), pilot.getActivity(), pilot.getVoice(),
            pilot.getVerified(), pilot.getManualTzActive(), pilot.getLanguages(), pilot.getIsPublic(),
            enriched.getTitle(), enriched.getEveBio(), enriched.getSp(), enriched.getSpByCat(), enriched.getTz(),
            enriched.getTzActive(), enriched.getTzPeak(), enriched.getLang(),
            enriched.getKbKills(), enriched.getKbLosses(), enriched.getKbEfficiency(),
            enriched.getIskDestroyed(), enriched.getHeatmap(), enriched.getLastSyncedAt(),
            skillEntries, queueEntries, recentSkillEntries, killEntries, historyEntries
        );
    }
}
