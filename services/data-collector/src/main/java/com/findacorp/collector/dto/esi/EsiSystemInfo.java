package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiSystemInfo {

    private String name;

    @JsonProperty("security_status")
    private Double securityStatus;
}
