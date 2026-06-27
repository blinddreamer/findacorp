package com.findacorp.application.dto;

import com.findacorp.application.domain.ThreadMessage;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long threadId,
        Long senderId,   // null = system message
        String body,
        LocalDateTime sentAt
) {
    public static MessageResponse from(ThreadMessage m) {
        return new MessageResponse(m.getId(), m.getThreadId(), m.getSenderId(),
                m.getBody(), m.getSentAt());
    }
}
