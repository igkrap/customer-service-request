ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS assigned_at TEXT,
    ADD COLUMN IF NOT EXISTS started_at TEXT,
    ADD COLUMN IF NOT EXISTS closed_at TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TEXT,
    ADD COLUMN IF NOT EXISTS reopened_at TEXT;

ALTER TABLE service_requests
    DROP CONSTRAINT IF EXISTS chk_service_requests_status;

UPDATE service_requests
SET status = 'CLOSED',
    closed_at = COALESCE(closed_at, resolved_at, TO_CHAR(updated_at, 'YYYYMMDD'))
WHERE status = 'RESOLVED';

ALTER TABLE service_requests
    ADD CONSTRAINT chk_service_requests_status
    CHECK (status IN (
        'OPEN',
        'TRIAGE',
        'ASSIGNED',
        'IN_PROGRESS',
        'WAITING_CUSTOMER',
        'HOLD',
        'RESOLVED',
        'REOPENED',
        'CLOSED',
        'CANCELLED'
    ));

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_at ON service_requests(assigned_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_started_at ON service_requests(started_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_closed_at ON service_requests(closed_at);
