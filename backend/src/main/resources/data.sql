-- Insert default admin user
-- Username: admin
-- Password: 1234 (BCrypt encrypted)
-- INSERT INTO users (id, user_id, username, email, password, role, created_at, updated_at)
-- VALUES (1, 'admin', 'admin', 'admin@example.com', '$2a$10$XptfskLsT1l/bRTLRiiCgejHqOpgXFreUnNUa35gJdCr2v2QbVFzu', 'ROLE_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
-- ON CONFLICT (user_id) DO NOTHING;

-- Insert test company
INSERT INTO companies (company_name, company_code, business_number, created_at, updated_at)
VALUES ('TEST', 'ACME', '123-45-67890', '2025-10-28 10:30:00', '2025-10-28 10:30:00')
ON CONFLICT (company_code) DO NOTHING;
