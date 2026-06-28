package com.findacorp.common.events;

import com.findacorp.common.dto.CorpHistoryDto;
import com.findacorp.common.dto.KillEventDto;
import com.findacorp.common.dto.SkillDto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PilotEnrichedEvent(
        Long characterId,
        String name,
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
        Double kbEfficiency,
        Long iskDestroyed,
        int[][] heatmap,
        List<SkillDto> skills,
        List<SkillDto> skillQueue,
        List<KillEventDto> killHistory,
        List<CorpHistoryDto> corpHistory,
        Instant syncedAt
) {}
