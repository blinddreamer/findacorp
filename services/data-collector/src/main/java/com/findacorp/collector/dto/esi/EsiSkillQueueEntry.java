package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiSkillQueueEntry {

    @JsonProperty("skill_id")
    private Integer skillId;

    @JsonProperty("finished_level")
    private Integer finishedLevel;

    @JsonProperty("queue_position")
    private Integer queuePosition;

    @JsonProperty("finish_date")
    private String finishDate;
}
