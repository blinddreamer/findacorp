package com.findacorp.auth.feign;

import com.findacorp.auth.dto.EveTokenResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "eve-sso", url = "${eve.sso.token-url}")
public interface EveSsoClient {

    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    EveTokenResponse exchangeAuthCode(
            @RequestHeader("Authorization") String basicAuth,
            @RequestParam("grant_type") String grantType,
            @RequestParam("code") String code,
            @RequestParam("redirect_uri") String redirectUri,
            @RequestParam("code_verifier") String codeVerifier);

    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    EveTokenResponse refreshToken(
            @RequestHeader("Authorization") String basicAuth,
            @RequestParam("grant_type") String grantType,
            @RequestParam("refresh_token") String refreshToken);
}
