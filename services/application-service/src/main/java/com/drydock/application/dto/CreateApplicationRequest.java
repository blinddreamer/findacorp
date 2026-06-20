package com.drydock.application.dto;

import com.drydock.application.domain.ApplicationDirection;

public record CreateApplicationRequest(
        Long corpId,
        Long pilotId,      // required only for CORP_TO_PILOT direction
        String message,
        ApplicationDirection direction
) {}
