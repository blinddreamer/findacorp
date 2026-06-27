package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiCorpHistoryEntry {

    @JsonProperty("corporation_id")
    private Long corporationId;

    @JsonProperty("record_id")
    private Integer recordId;

    @JsonProperty("start_date")
    private String startDate;

    @JsonProperty("is_deleted")
    private Boolean isDeleted;
}
