CREATE TABLE IF NOT EXISTS service_request_histories (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    from_manager_id BIGINT,
    to_manager_id BIGINT,
    note TEXT,
    created_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (from_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_service_request_histories_request_id
    ON service_request_histories(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_histories_created_at
    ON service_request_histories(created_at);
