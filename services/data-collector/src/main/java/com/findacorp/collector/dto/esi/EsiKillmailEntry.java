package com.findacorp.collector.dto.esi;

import com.findacorp.collector.dto.zkill.ZKillAttacker;
import com.findacorp.collector.dto.zkill.ZKillVictim;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class EsiKillmailEntry {

    @JsonProperty("killmail_id")
    private Long killmailId;

    @JsonProperty("killmail_time")
    private String killmailTime;

    @JsonProperty("solar_system_id")
    private Integer solarSystemId;

    private ZKillVictim victim;

    private List<ZKillAttacker> attackers;
}
