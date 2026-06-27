package com.findacorp.collector.dto.zkill;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ZKillVictim {

    @JsonProperty("character_id")
    private Long characterId;

    @JsonProperty("ship_type_id")
    private Integer shipTypeId;
}
