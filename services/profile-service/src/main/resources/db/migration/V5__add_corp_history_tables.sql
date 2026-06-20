CREATE TABLE corp_alliance_history (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    corp_id       BIGINT       NOT NULL,
    alliance_id   BIGINT,
    alliance_name VARCHAR(255),
    start_date    VARCHAR(30),
    end_date      VARCHAR(30),
    INDEX idx_cah_corp_id (corp_id)
);

CREATE TABLE corp_member_snapshots (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    corp_id    BIGINT   NOT NULL,
    members    INT,
    snapped_at DATETIME NOT NULL,
    INDEX idx_cms_corp_id (corp_id)
);
