package com.findacorp.common.dto;

import java.time.Instant;

public record KillEventDto(String kind, String ship, Integer shipTypeId, String system, String isk,
                           Instant whenAt, boolean finalBlow, String victimName) {}
