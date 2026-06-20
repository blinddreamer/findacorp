package com.drydock.common.events;

import com.drydock.common.dto.AllianceHistoryDto;

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
        Map<Long, String> memberNames,
        // characterId → ESI corp join date (start_date, ISO-8601); from member-tracking
        Map<Long, String> memberSince
) {}
