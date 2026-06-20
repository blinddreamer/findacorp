package com.drydock.common.dto;

public record CorpHistoryDto(Long corpId, String fromDate, String toDate, String corpName,
                             String alliance, String durationLabel) {}
