package com.findacorp.application.domain;

public enum ThreadType {
    /** A formal pilot↔corp recruitment application, with a status lifecycle. */
    APPLICATION,
    /** A free-form direct message conversation (e.g. an HR reaching out to a pilot). */
    DIRECT,
    /** A system-generated notification (no human sender). */
    SYSTEM
}
