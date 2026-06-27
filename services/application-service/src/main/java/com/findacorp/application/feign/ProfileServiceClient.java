package com.findacorp.application.feign;

import com.findacorp.application.dto.CorpSummary;
import com.findacorp.application.dto.PilotSummary;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "profile-service")
public interface ProfileServiceClient {

    @GetMapping("/profiles/pilot/{characterId}")
    PilotSummary getPilot(@PathVariable("characterId") Long characterId);

    @GetMapping("/profiles/corp/{corpId}")
    CorpSummary getCorp(@PathVariable("corpId") Long corpId);
}
