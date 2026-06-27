package com.findacorp.auth.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "profile-service")
public interface ProfileServiceClient {

    @DeleteMapping("/profiles/pilot/{characterId}")
    void deletePilot(@PathVariable("characterId") Long characterId);
}
