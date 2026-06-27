package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class EsiCorpAllianceEntry {
    @JsonProperty("alliance_id")  private Long    allianceId;
    @JsonProperty("start_date")   private String  startDate;
    @JsonProperty("is_deleted")   private Boolean isDeleted;
    @JsonProperty("record_id")    private Integer recordId;
}
