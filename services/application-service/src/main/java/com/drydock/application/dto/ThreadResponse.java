package com.drydock.application.dto;

import com.drydock.application.domain.ApplicationDirection;
import com.drydock.application.domain.ApplicationStatus;
import com.drydock.application.domain.ParticipantSide;
import com.drydock.application.domain.ThreadType;

import java.time.LocalDateTime;

/**
 * A thread as seen by one viewer. {@code mySide} and {@code unread} are computed for the
 * requesting character; {@code lastMessage}/{@code lastMessageAt} give an inbox preview.
 */
public record ThreadResponse(
        Long id,
        ThreadType type,
        ApplicationDirection direction,
        Long pilotId,
        String pilotName,
        Long corpId,
        String corpName,
        String corpTicker,
        String subject,
        ApplicationStatus status,
        ParticipantSide mySide,
        boolean unread,
        String lastMessage,
        LocalDateTime lastMessageAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
