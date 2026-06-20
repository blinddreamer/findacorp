package com.drydock.auth.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "data-collector")
public interface DataCollectorClient {

    @PostMapping("/internal/sync/on-login/pilot/{characterId}")
    void onLoginPilot(@PathVariable("characterId") Long characterId);

    @DeleteMapping("/internal/sync/pilot/{characterId}")
    void deletePilot(@PathVariable("characterId") Long characterId);
}
