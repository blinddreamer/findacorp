package com.findacorp.common.dto;

public record AllianceHistoryDto(
        Long allianceId,
        String allianceName,
        String startDate,
        String endDate
) {}
