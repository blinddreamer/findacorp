package com.findacorp.application.controller;

import com.findacorp.application.dto.CeoChangeNotificationRequest;
import com.findacorp.application.service.InboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Internal, service-to-service endpoints (not exposed through the gateway) used by other
 * services to raise inbox notifications.
 */
@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final InboxService service;

    @PostMapping("/ceo-change")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ceoChange(@RequestBody CeoChangeNotificationRequest req) {
        service.createCeoChangeNotification(req);
    }
}
