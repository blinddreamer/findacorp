CREATE TABLE IF NOT EXISTS pilots (
    character_id  BIGINT PRIMARY KEY,
    name          VARCHAR(255),
    bio           TEXT,
    looking_for   TEXT,
    roles         JSON,
    content       JSON,
    activity      VARCHAR(20),
    voice         VARCHAR(255),
    verified      BOOLEAN DEFAULT FALSE,
    updated_at    DATETIME DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS corps (
    corp_id      BIGINT PRIMARY KEY,
    name         VARCHAR(255),
    ticker       VARCHAR(20),
    faction      VARCHAR(20),
    tagline      VARCHAR(500),
    pitch        TEXT,
    requirements JSON,
    content      JSON,
    status       ENUM('open','selective','closed') DEFAULT 'open',
    updated_at   DATETIME DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS pilot_enriched (
    character_id   BIGINT PRIMARY KEY,
    sp             BIGINT,
    sp_by_cat      JSON,
    tz             VARCHAR(5),
    tz_active      JSON,
    tz_peak        JSON,
    lang           JSON,
    kb_kills       INT,
    kb_losses      INT,
    kb_efficiency  DECIMAL(5,2),
    isk_destroyed  BIGINT,
    heatmap        JSON,
    last_synced_at DATETIME
);

CREATE TABLE IF NOT EXISTS pilot_skills (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    character_id BIGINT NOT NULL,
    skill_name   VARCHAR(255),
    level        TINYINT,
    points       BIGINT,
    INDEX idx_ps_char (character_id)
);

CREATE TABLE IF NOT EXISTS pilot_kill_history (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    character_id BIGINT NOT NULL,
    kind         ENUM('kill','loss'),
    ship         VARCHAR(255),
    system       VARCHAR(255),
    isk          VARCHAR(50),
    when_at      DATETIME,
    final_blow   BOOLEAN,
    INDEX idx_pkh_char (character_id)
);

CREATE TABLE IF NOT EXISTS pilot_corp_history (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    character_id   BIGINT NOT NULL,
    corp_name      VARCHAR(255),
    alliance       VARCHAR(255),
    from_date      VARCHAR(10),
    to_date        VARCHAR(10),
    duration_label VARCHAR(50),
    INDEX idx_pch_char (character_id)
);

CREATE TABLE IF NOT EXISTS corp_enriched (
    corp_id        BIGINT PRIMARY KEY,
    members        INT,
    capacity       INT,
    alliance       VARCHAR(255),
    founded        YEAR,
    kills_last30   INT,
    efficiency     DECIMAL(5,2),
    last_synced_at DATETIME
);
