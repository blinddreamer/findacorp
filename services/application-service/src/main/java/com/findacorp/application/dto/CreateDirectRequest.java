package com.findacorp.application.dto;

/** Start (or continue) a direct message to a pilot — e.g. a recruiter reaching out. */
public record CreateDirectRequest(Long pilotId, String message) {}
