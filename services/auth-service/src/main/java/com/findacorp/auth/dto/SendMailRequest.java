package com.findacorp.auth.dto;

/** Request to send a real EVE in-game mail from the authenticated caller to a character. */
public record SendMailRequest(Long recipientId, String subject, String body) {}
