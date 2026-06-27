package com.findacorp.common.events;

import com.findacorp.common.dto.AllianceHistoryDto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CorpEnrichedEvent(
        Long corpId,
        String name,
        String ticker,
        Integer members,
        Integer capacity,
        String alliance,
        Integer founded,
        Integer killsLast30,
        Double efficiency,
        Instant syncedAt,
        Long ceoId,
        String ceoName,
        List<AllianceHistoryDto> allianceHistory,
        // characterId → name for the corp's current roster (sourced from EVE Who)
        Map<Long, String> memberNames
) {}
