package com.findacorp.profile.dto;

import java.util.List;

public record UpdatePilotRequest(
    String bio,
    String lookingFor,
    List<String> roles,
    List<String> content,
    String activity,
    String voice,
    List<Integer> manualTzActive,
    List<String> languages,
    Boolean isPublic
) {}
