package com.findacorp.collector.dto.zkill;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ZKillAttacker {

    @JsonProperty("character_id")
    private Long characterId;

    @JsonProperty("final_blow")
    private Boolean finalBlow;

    @JsonProperty("ship_type_id")
    private Integer shipTypeId;
}
