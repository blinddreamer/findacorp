package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiTypeInfo {

    private String name;

    @JsonProperty("group_id")
    private Integer groupId;
}
