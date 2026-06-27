package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiCharacterInfo {

    private String name;

    @JsonProperty("corporation_id")
    private Long corporationId;

    @JsonProperty("alliance_id")
    private Long allianceId;
}
