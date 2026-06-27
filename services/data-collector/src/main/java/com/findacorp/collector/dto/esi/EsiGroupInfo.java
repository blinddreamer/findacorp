package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiGroupInfo {

    private String name;

    @JsonProperty("category_id")
    private Integer categoryId;
}
