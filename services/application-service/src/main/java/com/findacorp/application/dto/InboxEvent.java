package com.findacorp.application.dto;

/**
 * Lightweight server-sent event pushed to a participant's inbox stream.
 * Carries only the thread id and a coarse type; the client reacts by refetching
 * the affected queries rather than trusting a payload it can't authorize.
 */
public record InboxEvent(String type, Long threadId) {

    public static InboxEvent message(Long threadId) {
        return new InboxEvent("message", threadId);
    }

    public static InboxEvent status(Long threadId) {
        return new InboxEvent("status", threadId);
    }
}
