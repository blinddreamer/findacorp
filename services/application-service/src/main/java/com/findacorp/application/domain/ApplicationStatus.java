package com.findacorp.application.domain;

public enum ApplicationStatus {
    /** Newly submitted, not yet actioned by a recruiter. */
    SENT,
    /** A recruiter has opened/replied to it (seen), but not formally triaged. */
    READ,
    /** A recruiter is actively reviewing the application. */
    UNDER_REVIEW,
    /** Approved by the corp. */
    ACCEPTED,
    /** Rejected by the corp. */
    REJECTED,
    /** Withdrawn by the pilot. */
    WITHDRAWN
}
