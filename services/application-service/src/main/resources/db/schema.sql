CREATE DATABASE IF NOT EXISTS application_db;
USE application_db;

CREATE TABLE IF NOT EXISTS applications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    pilot_id    BIGINT NOT NULL,
    corp_id     BIGINT NOT NULL,
    direction   ENUM('PILOT_TO_CORP','CORP_TO_PILOT') NOT NULL,
    message     TEXT NOT NULL,
    pilot_name  VARCHAR(255),
    corp_name   VARCHAR(255),
    corp_ticker VARCHAR(20),
    status      ENUM('SENT','READ','ACCEPTED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SENT',
    sent_at     DATETIME NOT NULL DEFAULT NOW(),
    updated_at  DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    INDEX idx_pilot (pilot_id),
    INDEX idx_corp  (corp_id)
);

CREATE TABLE IF NOT EXISTS application_messages (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    sender_id      BIGINT NOT NULL,
    body           TEXT NOT NULL,
    sent_at        DATETIME NOT NULL DEFAULT NOW(),
    INDEX idx_app (application_id)
);
