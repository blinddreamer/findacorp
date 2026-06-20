package com.drydock.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * One entry from ESI {@code GET /corporations/{id}/membertracking/}.
 * Requires the {@code esi-corporations.track_members.v1} scope and a Director-role token.
 * Only {@code character_id} and {@code start_date} (corp join date) are used here.
 */
@Data
public class EsiMemberTracking {

    @JsonProperty("character_id")
    private Long characterId;

    @JsonProperty("start_date")
    private String startDate;
}
