CREATE TABLE IF NOT EXISTS pilots (
    character_id    BIGINT PRIMARY KEY,
    name            VARCHAR(255),
    bio             TEXT,
    looking_for     TEXT,
    roles           JSON,
    content         JSON,
    activity        VARCHAR(20),
    voice           VARCHAR(255),
    verified        BOOLEAN DEFAULT FALSE,
    is_public       BOOLEAN DEFAULT TRUE,
    manual_tz_active JSON,
    updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS corps (
    corp_id       BIGINT PRIMARY KEY,
    name          VARCHAR(255),
    ticker        VARCHAR(20),
    faction       VARCHAR(20),
    tagline       VARCHAR(500),
    pitch         TEXT,
    requirements  JSON,
    content       JSON,
    roles_looking JSON,
    languages     JSON,
    tz_hours      JSON,
    hr_ids        JSON,
    is_public     BOOLEAN DEFAULT TRUE,
    status        ENUM('open','selective','closed') DEFAULT 'open',
    tz            VARCHAR(5),
    min_sp        BIGINT,
    updated_at    DATETIME DEFAULT NOW() ON UPDATE NOW()
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
    skill_queue    JSON,
    last_synced_at DATETIME
);

CREATE TABLE IF NOT EXISTS pilot_skills (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    character_id BIGINT NOT NULL,
    skill_name   VARCHAR(255),
    level        TINYINT,
    points       BIGINT,
    learned_at   DATETIME NULL,
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
    victim_name  VARCHAR(255),
    INDEX idx_pkh_char (character_id)
);

CREATE TABLE IF NOT EXISTS pilot_corp_history (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    character_id   BIGINT NOT NULL,
    corp_id        BIGINT,
    corp_name      VARCHAR(255),
    alliance       VARCHAR(255),
    `from_date`    VARCHAR(10),
    `to_date`      VARCHAR(10),
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
    ceo_id         BIGINT,
    ceo_login_required BOOLEAN DEFAULT FALSE,
    last_synced_at DATETIME
);

CREATE TABLE IF NOT EXISTS corp_members (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    corp_id        BIGINT       NOT NULL,
    character_id   BIGINT       NOT NULL,
    character_name VARCHAR(255),
    INDEX idx_cm_corp_id (corp_id)
);

CREATE TABLE IF NOT EXISTS corp_member_events (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    corp_id        BIGINT      NOT NULL,
    character_id   BIGINT      NOT NULL,
    character_name VARCHAR(255),
    event_type     VARCHAR(10) NOT NULL,
    occurred_at    DATETIME    NOT NULL,
    INDEX idx_cme_corp_id (corp_id)
);

CREATE TABLE IF NOT EXISTS corp_alliance_history (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    corp_id       BIGINT       NOT NULL,
    alliance_id   BIGINT,
    alliance_name VARCHAR(255),
    start_date    VARCHAR(30),
    end_date      VARCHAR(30),
    INDEX idx_cah_corp_id (corp_id)
);

CREATE TABLE IF NOT EXISTS corp_member_snapshots (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    corp_id    BIGINT   NOT NULL,
    members    INT,
    snapped_at DATETIME NOT NULL,
    INDEX idx_cms_corp_id (corp_id)
);

-- Incremental migrations for existing databases
ALTER TABLE pilots ADD COLUMN IF NOT EXISTS manual_tz_active JSON;
ALTER TABLE pilot_enriched ADD COLUMN IF NOT EXISTS skill_queue JSON;
ALTER TABLE pilot_kill_history ADD COLUMN IF NOT EXISTS victim_name VARCHAR(255);
ALTER TABLE pilot_corp_history ADD COLUMN IF NOT EXISTS corp_id BIGINT;
ALTER TABLE pilots ADD COLUMN IF NOT EXISTS languages JSON;
ALTER TABLE pilot_skills ADD COLUMN IF NOT EXISTS learned_at DATETIME NULL;
ALTER TABLE pilot_skills ADD COLUMN IF NOT EXISTS category VARCHAR(255) NULL;
ALTER TABLE pilot_kill_history ADD COLUMN IF NOT EXISTS ship_type_id INT NULL;
ALTER TABLE corps ADD COLUMN IF NOT EXISTS roles_looking JSON;
ALTER TABLE corps ADD COLUMN IF NOT EXISTS languages JSON;
ALTER TABLE corps ADD COLUMN IF NOT EXISTS tz_hours JSON;
ALTER TABLE corps ADD COLUMN IF NOT EXISTS hr_ids JSON;
ALTER TABLE pilots ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE corps  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE corp_enriched ADD COLUMN IF NOT EXISTS ceo_id BIGINT;
ALTER TABLE corp_enriched ADD COLUMN IF NOT EXISTS ceo_login_required BOOLEAN DEFAULT FALSE;
-- Denormalized, queryable derivations for search filtering (see docs/search-db-pagination-spec.md)
ALTER TABLE corps ADD COLUMN IF NOT EXISTS tz     VARCHAR(5);
ALTER TABLE corps ADD COLUMN IF NOT EXISTS min_sp BIGINT;
CREATE INDEX IF NOT EXISTS idx_corps_status ON corps (status);
CREATE INDEX IF NOT EXISTS idx_corps_tz     ON corps (tz);
CREATE INDEX IF NOT EXISTS idx_pe_sp        ON pilot_enriched (sp);
CREATE INDEX IF NOT EXISTS idx_pe_tz        ON pilot_enriched (tz);
