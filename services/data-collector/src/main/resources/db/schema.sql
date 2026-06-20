CREATE TABLE sync_targets (
    entity_id    BIGINT NOT NULL,
    entity_type  ENUM('PILOT','CORP') NOT NULL,
    next_sync_at DATETIME NOT NULL DEFAULT NOW(),
    last_sync_at DATETIME,
    sync_status  ENUM('PENDING','IN_PROGRESS','SUCCESS','FAILED') DEFAULT 'PENDING',
    PRIMARY KEY (entity_id, entity_type)
);

CREATE TABLE sync_log (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_id    BIGINT NOT NULL,
    entity_type  ENUM('PILOT','CORP') NOT NULL,
    synced_at    DATETIME NOT NULL DEFAULT NOW(),
    source       ENUM('ESI','ZKILL') NOT NULL,
    success      BOOLEAN NOT NULL,
    error_msg    TEXT,
    INDEX idx_entity (entity_id, entity_type)
);
