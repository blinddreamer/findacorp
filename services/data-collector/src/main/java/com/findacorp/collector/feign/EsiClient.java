package com.findacorp.collector.feign;

import com.findacorp.collector.dto.esi.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

// Note: killmail endpoint is unauthenticated — hash acts as capability token

@FeignClient(name = "esi", url = "${esi.base-url}")
public interface EsiClient {

    @GetMapping("/characters/{characterId}/skills/")
    EsiSkillsResponse getSkills(@PathVariable("characterId") Long characterId,
                                @RequestHeader("Authorization") String bearer);

    @GetMapping("/characters/{characterId}/corporationhistory/")
    List<EsiCorpHistoryEntry> getCorpHistory(@PathVariable("characterId") Long characterId);

    @GetMapping("/corporations/{corpId}/")
    EsiCorpInfo getCorpInfo(@PathVariable("corpId") Long corpId);

    @GetMapping("/corporations/{corpId}/alliancehistory/")
    List<EsiCorpAllianceEntry> getCorpAllianceHistory(@PathVariable("corpId") Long corpId);

    @GetMapping("/characters/{characterId}/")
    EsiCharacterInfo getCharacterInfo(@PathVariable("characterId") Long characterId);

    @GetMapping("/universe/types/{typeId}/")
    EsiTypeInfo getTypeInfo(@PathVariable("typeId") Integer typeId);

    @GetMapping("/universe/groups/{groupId}/")
    EsiGroupInfo getGroupInfo(@PathVariable("groupId") Integer groupId);

    @GetMapping("/universe/systems/{systemId}/")
    EsiSystemInfo getSystemInfo(@PathVariable("systemId") Integer systemId);

    @GetMapping("/alliances/{allianceId}/")
    EsiAllianceInfo getAllianceInfo(@PathVariable("allianceId") Long allianceId);

    @GetMapping("/killmails/{killmailId}/{hash}/")
    EsiKillmailEntry getKillmail(@PathVariable("killmailId") Long killmailId,
                                 @PathVariable("hash") String hash);

    @GetMapping("/characters/{characterId}/skillqueue/")
    java.util.List<EsiSkillQueueEntry> getSkillQueue(
            @PathVariable("characterId") Long characterId,
            @RequestHeader("Authorization") String bearer);
}
