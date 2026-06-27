package com.findacorp.application.dto;

import com.findacorp.application.domain.ApplicationStatus;

public record UpdateStatusRequest(ApplicationStatus status) {}
