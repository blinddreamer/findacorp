-- Run against auth_db before starting auth-service (ddl-auto: validate requires tables to exist)
-- token_expires_at is added beyond the base spec to support auto-refresh in /auth/token/{characterId}

CREATE TABLE IF NOT EXISTS users (
    character_id      BIGINT PRIMARY KEY,
    character_name    VARCHAR(255) NOT NULL,
    access_token      TEXT,
    refresh_token     TEXT,
    token_expires_at  DATETIME,
    scopes            VARCHAR(1000),
    created_at        DATETIME NOT NULL DEFAULT NOW(),
    last_login        DATETIME
);

CREATE TABLE IF NOT EXISTS oauth_states (
    state          VARCHAR(128) PRIMARY KEY,
    code_verifier  VARCHAR(256) NOT NULL,
    redirect_uri   VARCHAR(512) NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT NOW()
);
