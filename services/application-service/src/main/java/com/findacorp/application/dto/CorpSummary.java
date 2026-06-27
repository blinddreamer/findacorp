package com.findacorp.application.dto;

import java.util.List;

/**
 * Corp summary from profile-service. {@code ceoId} and {@code hrIds} let us expand the
 * corp side of a thread into participant characters. These come from the existing
 * /profiles/corp/{id} response (extra fields are ignored by Jackson).
 */
public record CorpSummary(
        Long corpId,
        String name,
        String ticker,
        Long ceoId,
        List<Long> hrIds
) {}
