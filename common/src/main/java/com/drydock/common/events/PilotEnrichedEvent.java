package com.drydock.common.events;

import com.drydock.common.dto.CorpHistoryDto;
import com.drydock.common.dto.KillEventDto;
import com.drydock.common.dto.SkillDto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PilotEnrichedEvent(
        Long characterId,
        String name,
        Long sp,
        Map<String, Long> spByCat,
        String tz,
        List<Integer> tzActive,
        List<Integer> tzPeak,
        List<String> lang,
        Integer kbKills,
        Integer kbLosses,
        Double kbEfficiency,
        Long iskDestroyed,
        int[][] heatmap,
        List<SkillDto> skills,
        List<SkillDto> skillQueue,
        List<KillEventDto> killHistory,
        List<CorpHistoryDto> corpHistory,
        Instant syncedAt
) {}
