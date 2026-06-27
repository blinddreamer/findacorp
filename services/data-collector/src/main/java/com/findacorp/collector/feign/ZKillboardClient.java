package com.findacorp.collector.feign;

import com.findacorp.collector.dto.zkill.ZKillCharacterStats;
import com.findacorp.collector.dto.zkill.ZKillEntry;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "zkillboard", url = "${zkill.base-url}", configuration = ZKillFeignConfig.class)
public interface ZKillboardClient {

    @GetMapping("/kills/characterID/{characterId}/")
    List<ZKillEntry> getKills(@PathVariable("characterId") Long characterId);

    @GetMapping("/losses/characterID/{characterId}/")
    List<ZKillEntry> getLosses(@PathVariable("characterId") Long characterId);

    @GetMapping("/kills/corporationID/{corpId}/")
    List<ZKillEntry> getCorpKills(@PathVariable("corpId") Long corpId);

    @GetMapping("/losses/corporationID/{corpId}/")
    List<ZKillEntry> getCorpLosses(@PathVariable("corpId") Long corpId);

    @GetMapping("/stats/characterID/{characterId}/")
    ZKillCharacterStats getCharacterStats(@PathVariable("characterId") Long characterId);

    @GetMapping("/stats/corporationID/{corpId}/")
    ZKillCharacterStats getCorpStats(@PathVariable("corpId") Long corpId);
}
