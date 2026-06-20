package com.drydock.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiSkillItem {

    @JsonProperty("skill_id")
    private Integer skillId;

    @JsonProperty("trained_skill_level")
    private Integer trainedSkillLevel;

    @JsonProperty("skillpoints_in_skill")
    private Long skillpointsInSkill;

    @JsonProperty("active_skill_level")
    private Integer activeSkillLevel;
}
