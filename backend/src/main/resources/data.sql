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

-- Insert default email templates
INSERT INTO email_templates (template_code, template_name, subject, body, description, variables, enabled)
VALUES
('TEST_EMAIL', 'Test Email', 'Test Email', 'This is a test email. Your email configuration is working.', 'Test email template', 'toEmail', true),
('SERVICE_REQUEST_CREATED', 'Service Request Created', 'New Request: {{requestTitle}}', 'New service request ID {{requestId}} has been assigned to you.
Title: {{requestTitle}}', 'Sent to manager when a new service request is created', 'requestTitle, requestId', true),
('SERVICE_REQUEST_STATUS_CHANGED', 'Service Request Status Changed', 'Status Update: {{requestTitle}}', 'Your service request status has been updated.
Title: {{requestTitle}}
Status: {{oldStatus}} -> {{newStatus}}', 'Sent to customer when service request status changes', 'requestTitle, oldStatus, newStatus', true),
('SERVICE_REQUEST_RESOLVED', 'Service Request Resolved', 'Resolved: {{requestTitle}}', 'Your service request has been resolved.
Title: {{requestTitle}}
Notes: {{resolutionNotes}}', 'Sent to customer when service request is resolved', 'requestTitle, resolutionNotes', true),
('USER_APPROVED', 'User Approved', 'Account Approved', 'Hello {{username}}, your account has been approved. You can now log in.', 'Sent to user when account is approved', 'username', true),
('USER_REJECTED', 'User Rejected', 'Account Registration', 'Hello {{username}}, your account registration has been rejected. Please contact the administrator.', 'Sent to user when account is rejected', 'username', true),
('PROJECT_REQUEST_APPROVED', 'Project Request Approved', 'Project Approved: {{projectName}}', 'Your project request has been approved.
Project: {{projectName}}', 'Sent to requester when project request is approved', 'projectName', true),
('PROJECT_REQUEST_REJECTED', 'Project Request Rejected', 'Project Rejected: {{projectName}}', 'Your project request has been rejected.
Project: {{projectName}}
Reason: {{approvalNotes}}', 'Sent to requester when project request is rejected', 'projectName, approvalNotes', true),
('MANAGER_ASSIGNED', 'Manager Assigned', 'Assigned: {{requestTitle}}', 'You have been assigned to service request ID {{requestId}}.
Title: {{requestTitle}}', 'Sent to manager when assigned to a service request', 'requestTitle, requestId', true)
ON CONFLICT (template_code) DO NOTHING;
