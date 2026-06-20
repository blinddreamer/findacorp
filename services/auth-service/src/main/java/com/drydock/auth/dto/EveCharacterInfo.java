package com.drydock.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EveCharacterInfo(
    @JsonProperty("CharacterID")   Long characterId,
    @JsonProperty("CharacterName") String characterName,
    @JsonProperty("Scopes")        String scopes,
    @JsonProperty("ExpiresOn")     String expiresOn
) {}
