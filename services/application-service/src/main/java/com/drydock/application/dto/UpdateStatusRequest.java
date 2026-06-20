package com.drydock.application.dto;

import com.drydock.application.domain.ApplicationStatus;

public record UpdateStatusRequest(ApplicationStatus status) {}
