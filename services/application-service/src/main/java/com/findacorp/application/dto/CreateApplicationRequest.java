package com.findacorp.application.dto;

import com.findacorp.application.domain.ApplicationDirection;

public record CreateApplicationRequest(
        Long corpId,
        Long pilotId,      // required only for CORP_TO_PILOT direction
        String message,
        ApplicationDirection direction
) {}
