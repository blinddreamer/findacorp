package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class EsiSkillsResponse {

    @JsonProperty("total_sp")
    private Long totalSp;

    @JsonProperty("unallocated_sp")
    private Long unallocatedSp;

    private List<EsiSkillItem> skills;
}
