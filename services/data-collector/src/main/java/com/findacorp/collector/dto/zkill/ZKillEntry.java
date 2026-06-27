package com.findacorp.collector.dto.zkill;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ZKillEntry {

    @JsonProperty("killmail_id")
    private Long killmailId;

    @JsonProperty("killmail_time")
    private String killmailTime;

    @JsonProperty("solar_system_id")
    private Integer solarSystemId;

    private ZKillVictim victim;

    private List<ZKillAttacker> attackers;

    private ZKillStats zkb;
}
