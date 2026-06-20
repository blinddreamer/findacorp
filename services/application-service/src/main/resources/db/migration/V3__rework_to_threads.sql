-- Rework messaging from application-only to a generic thread model so the inbox can
-- carry pilot applications, direct recruiting DMs, and system notifications alike.
-- The corp side of a thread is expanded into participant rows (CEO + appointed HRs),
-- which fixes corp recruiters never seeing applications addressed to their corp id.
--
-- The legacy applications / application_messages tables are left in place (unused) to
-- avoid destructive data loss; the new model lives in its own tables.

CREATE TABLE IF NOT EXISTS threads (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    type        ENUM('APPLICATION','DIRECT','SYSTEM') NOT NULL,
    direction   ENUM('PILOT_TO_CORP','CORP_TO_PILOT') NULL,
    pilot_id    BIGINT NULL,
    corp_id     BIGINT NULL,
    pilot_name  VARCHAR(255),
    corp_name   VARCHAR(255),
    corp_ticker VARCHAR(20),
    subject     VARCHAR(255) NULL,
    status      ENUM('SENT','READ','ACCEPTED','REJECTED','WITHDRAWN') NULL,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    INDEX idx_threads_pilot (pilot_id),
    INDEX idx_threads_corp  (corp_id)
);

CREATE TABLE IF NOT EXISTS thread_participants (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    thread_id    BIGINT NOT NULL,
    character_id BIGINT NOT NULL,
    side         ENUM('PILOT','CORP') NOT NULL,
    last_read_at DATETIME NULL,
    INDEX idx_tp_thread    (thread_id),
    INDEX idx_tp_character (character_id),
    CONSTRAINT fk_tp_thread FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS thread_messages (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    thread_id BIGINT NOT NULL,
    sender_id BIGINT NULL,           -- null = system-generated message
    body      TEXT   NOT NULL,
    sent_at   DATETIME NOT NULL,
    INDEX idx_tm_thread (thread_id),
    CONSTRAINT fk_tm_thread FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
);
