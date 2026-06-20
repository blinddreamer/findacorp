CREATE TABLE IF NOT EXISTS applications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    pilot_id    BIGINT NOT NULL,
    corp_id     BIGINT NOT NULL,
    direction   ENUM('PILOT_TO_CORP','CORP_TO_PILOT') NOT NULL,
    message     TEXT NOT NULL,
    status      ENUM('SENT','READ','ACCEPTED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SENT',
    sent_at     DATETIME NOT NULL DEFAULT NOW(),
    updated_at  DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    INDEX idx_pilot (pilot_id),
    INDEX idx_corp  (corp_id)
);
