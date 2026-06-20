package com.drydock.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
    String secret,
    int accessExpiryMinutes,
    int refreshExpiryDays
) {}
