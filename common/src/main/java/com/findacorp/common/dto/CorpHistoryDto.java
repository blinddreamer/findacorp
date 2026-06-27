package com.findacorp.common.dto;

public record CorpHistoryDto(Long corpId, String fromDate, String toDate, String corpName,
                             String alliance, String durationLabel) {}
