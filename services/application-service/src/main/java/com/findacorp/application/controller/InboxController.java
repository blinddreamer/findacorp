package com.findacorp.application.controller;

import com.findacorp.application.dto.*;
import com.findacorp.application.service.InboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inbox")
@RequiredArgsConstructor
public class InboxController {

    private final InboxService service;

    /** Pilot creates an application to a corp. */
    @PostMapping("/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ThreadResponse createApplication(
            @RequestHeader("X-Character-Id") Long characterId,
            @RequestBody CreateApplicationRequest req) {
        return service.createApplication(characterId, req);
    }

    /** Recruiter sends a direct message to a pilot (no application required). */
    @PostMapping("/direct")
    @ResponseStatus(HttpStatus.CREATED)
    public ThreadResponse createDirect(
            @RequestHeader("X-Character-Id") Long characterId,
            @RequestBody CreateDirectRequest req) {
        return service.createDirectMessage(characterId, req);
    }

    /** All threads the caller participates in (applications, DMs, system notifications). */
    @GetMapping
    public List<ThreadResponse> list(@RequestHeader("X-Character-Id") Long characterId) {
        return service.listThreads(characterId);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse getUnreadCount(@RequestHeader("X-Character-Id") Long characterId) {
        return service.getUnreadCount(characterId);
    }

    @GetMapping("/{threadId}/messages")
    public List<MessageResponse> getMessages(
            @PathVariable("threadId") Long threadId,
            @RequestHeader("X-Character-Id") Long characterId) {
        return service.getMessages(threadId, characterId);
    }

    @PostMapping("/{threadId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(
            @PathVariable("threadId") Long threadId,
            @RequestHeader("X-Character-Id") Long characterId,
            @RequestBody SendMessageRequest req) {
        return service.sendMessage(threadId, characterId, req);
    }

    @PutMapping("/{threadId}/status")
    public ThreadResponse updateStatus(
            @PathVariable("threadId") Long threadId,
            @RequestHeader("X-Character-Id") Long characterId,
            @RequestBody UpdateStatusRequest req) {
        return service.updateStatus(threadId, characterId, req);
    }
}
