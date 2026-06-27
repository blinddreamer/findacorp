package com.findacorp.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EveTokenResponse(
    @JsonProperty("access_token")  String accessToken,
    @JsonProperty("expires_in")    int expiresIn,
    @JsonProperty("token_type")    String tokenType,
    @JsonProperty("refresh_token") String refreshToken
) {}
