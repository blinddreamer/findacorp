package com.findacorp.profile.dto;

import java.util.List;

/** Payload sent to application-service to raise a "new CEO must log in" inbox notification. */
public record CeoChangeNotification(
        Long corpId,
        String corpName,
        Long newCeoId,
        String newCeoName,
        List<Long> recipientIds
) {}
