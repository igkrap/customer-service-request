-- Insert default admin user
-- Username: admin
-- Password: 1234 (BCrypt encrypted)
--INSERT OR IGNORE INTO users (id, username, email, password, role, created_at, updated_at)
--VALUES (1, 'admin', 'admin@example.com', '$2a$10$XptfskLsT1l/bRTLRiiCgejHqOpgXFreUnNUa35gJdCr2v2QbVFzu', 'ROLE_ADMIN', datetime('now'), datetime('now'));
INSERT INTO company (company_name, company_code, business_number, created_at, updated_at) VALUES ('TEST', 'ACME', '123-45-67890', '2025-10-28 10:30:00', '2025-10-28 10:30:00');
