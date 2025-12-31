ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS received_at TEXT;

UPDATE service_requests
SET received_at = to_char(created_at, 'YYYYMMDD')
WHERE received_at IS NULL;

ALTER TABLE service_requests
    ALTER COLUMN resolved_at TYPE TEXT
    USING CASE
        WHEN resolved_at IS NULL THEN NULL
        ELSE to_char(resolved_at, 'YYYYMMDD')
    END;
