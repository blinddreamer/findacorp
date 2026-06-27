package com.findacorp.collector.feign;

import com.findacorp.collector.dto.evewho.EveWhoCorpList;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * EVE Who public API — corp roster lookup with no EVE SSO scope or CEO token.
 */
@FeignClient(name = "evewho", url = "${evewho.base-url}", configuration = EveWhoFeignConfig.class)
public interface EveWhoClient {

    @GetMapping("/corplist/{corpId}")
    EveWhoCorpList getCorpList(@PathVariable("corpId") Long corpId);
}
