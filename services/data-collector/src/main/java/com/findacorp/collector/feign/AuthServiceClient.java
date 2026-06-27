package com.findacorp.collector.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service")
public interface AuthServiceClient {

    @GetMapping("/auth/token/{characterId}")
    String getEveAccessToken(@PathVariable("characterId") Long characterId);
}
