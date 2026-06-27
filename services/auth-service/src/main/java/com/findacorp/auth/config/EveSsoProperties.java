package com.findacorp.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "eve.sso")
public record EveSsoProperties(
    String clientId,
    String clientSecret,
    String authorizeUrl,
    String tokenUrl,
    String verifyUrl,
    String scopes,
    String callbackUrl
) {}
