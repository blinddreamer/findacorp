ALTER TABLE applications
    ADD COLUMN pilot_name  VARCHAR(255) NULL,
    ADD COLUMN corp_name   VARCHAR(255) NULL,
    ADD COLUMN corp_ticker VARCHAR(20)  NULL;

CREATE TABLE IF NOT EXISTS application_messages (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT       NOT NULL,
    sender_id      BIGINT       NOT NULL,
    body           TEXT         NOT NULL,
    sent_at        DATETIME     NOT NULL,
    INDEX idx_msg_application (application_id),
    CONSTRAINT fk_msg_application FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
);
