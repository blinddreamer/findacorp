-- Add the UNDER_REVIEW application status (recruiter is actively reviewing).
-- The status column is a MariaDB ENUM, so the allowed set must be extended
-- explicitly; ordering keeps it in the natural lifecycle sequence.
ALTER TABLE threads
    MODIFY COLUMN status ENUM('SENT','READ','UNDER_REVIEW','ACCEPTED','REJECTED','WITHDRAWN') NULL;
