package com.findacorp.collector.dto.esi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class EsiCorpInfo {

    private String name;
    private String ticker;

    @JsonProperty("alliance_id")
    private Long allianceId;

    @JsonProperty("member_count")
    private Integer memberCount;

    @JsonProperty("date_founded")
    private String dateFounded;

    @JsonProperty("ceo_id")
    private Long ceoId;
}
