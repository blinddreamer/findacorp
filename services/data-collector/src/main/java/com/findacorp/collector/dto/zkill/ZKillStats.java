package com.findacorp.collector.dto.zkill;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ZKillStats {

    @JsonProperty("totalValue")
    private Double totalValue;

    @JsonProperty("fittedValue")
    private Double fittedValue;

    @JsonProperty("hash")
    private String hash;

    @JsonProperty("npc")
    private Boolean npc;
}
