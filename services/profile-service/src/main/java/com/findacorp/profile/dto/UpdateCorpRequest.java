package com.findacorp.profile.dto;

import com.findacorp.profile.domain.Corp;

import java.util.List;

public record UpdateCorpRequest(
    String name,
    String ticker,
    String faction,
    String tagline,
    String pitch,
    List<String> requirements,
    List<String> doctrines,
    List<String> content,
    Corp.CorpStatus status,
    List<String> rolesLooking,
    List<String> languages,
    List<Integer> tzHours,
    List<Long> hrIds
) {}
