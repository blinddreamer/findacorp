package com.drydock.profile.dto;

public record GlobalSearchResult(
    String type,   // "pilot" | "corp"
    Long id,
    String name,
    String ticker
) {}
