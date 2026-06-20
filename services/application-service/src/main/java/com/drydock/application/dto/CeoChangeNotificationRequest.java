package com.drydock.application.dto;

import java.util.List;

/** Inbound request from profile-service to notify a corp's HRs that the CEO changed. */
public record CeoChangeNotificationRequest(
        Long corpId,
        String corpName,
        Long newCeoId,
        String newCeoName,
        List<Long> recipientIds
) {}
