package com.drydock.auth.feign;

import com.drydock.auth.dto.EveCharacterInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "eve-verify", url = "${eve.sso.verify-url}")
public interface EveVerifyClient {

    @GetMapping
    EveCharacterInfo verify(@RequestHeader("Authorization") String bearerToken);
}
