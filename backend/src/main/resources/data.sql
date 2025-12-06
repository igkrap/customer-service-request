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
('TEST_EMAIL', '테스트 이메일', '테스트 이메일', '<h2>테스트 이메일</h2><p>이메일 설정이 정상적으로 작동하고 있습니다.</p><p>수신 이메일: <strong>{{toEmail}}</strong></p>', '이메일 설정 테스트용 템플릿', 'toEmail', true),
('SERVICE_REQUEST_CREATED', '서비스 요청 생성', '[새 요청] {{requestTitle}}', '<h2>새로운 서비스 요청이 배정되었습니다</h2><p>새로운 서비스 요청이 귀하에게 배정되었습니다.</p><ul><li><strong>요청 ID:</strong> {{requestId}}</li><li><strong>제목:</strong> {{requestTitle}}</li></ul><p>시스템에 로그인하여 자세한 내용을 확인해주세요.</p>', '담당자에게 새 서비스 요청 생성 시 발송', 'requestTitle, requestId', true),
('SERVICE_REQUEST_STATUS_CHANGED', '서비스 요청 상태 변경', '[상태 변경] {{requestTitle}}', '<h2>서비스 요청 상태가 변경되었습니다</h2><p>귀하의 서비스 요청 상태가 업데이트되었습니다.</p><ul><li><strong>제목:</strong> {{requestTitle}}</li><li><strong>상태 변경:</strong> {{oldStatus}} → {{newStatus}}</li></ul><p>자세한 내용은 시스템에서 확인해주세요.</p>', '고객에게 요청 상태 변경 시 발송', 'requestTitle, oldStatus, newStatus', true),
('SERVICE_REQUEST_RESOLVED', '서비스 요청 완료', '[완료] {{requestTitle}}', '<h2>서비스 요청이 완료되었습니다</h2><p>귀하의 서비스 요청이 성공적으로 처리되었습니다.</p><ul><li><strong>제목:</strong> {{requestTitle}}</li><li><strong>처리 내용:</strong> {{resolutionNotes}}</li></ul><p>감사합니다.</p>', '고객에게 요청 완료 시 발송', 'requestTitle, resolutionNotes', true),
('USER_APPROVED', '사용자 승인', '계정이 승인되었습니다', '<h2>계정 승인 완료</h2><p>안녕하세요, <strong>{{username}}</strong>님</p><p>귀하의 계정이 승인되었습니다. 이제 시스템에 로그인하실 수 있습니다.</p><p>감사합니다.</p>', '사용자 계정 승인 시 발송', 'username', true),
('USER_REJECTED', '사용자 거부', '계정 등록 거부', '<h2>계정 등록 거부</h2><p>안녕하세요, <strong>{{username}}</strong>님</p><p>귀하의 계정 등록이 거부되었습니다. 자세한 사항은 관리자에게 문의해주세요.</p>', '사용자 계정 거부 시 발송', 'username', true),
('PROJECT_REQUEST_APPROVED', '프로젝트 요청 승인', '[승인] {{projectName}}', '<h2>프로젝트 요청이 승인되었습니다</h2><p>귀하의 프로젝트 요청이 승인되었습니다.</p><ul><li><strong>프로젝트:</strong> {{projectName}}</li></ul><p>프로젝트를 진행해주세요.</p>', '프로젝트 요청 승인 시 발송', 'projectName', true),
('PROJECT_REQUEST_REJECTED', '프로젝트 요청 거부', '[거부] {{projectName}}', '<h2>프로젝트 요청이 거부되었습니다</h2><p>귀하의 프로젝트 요청이 거부되었습니다.</p><ul><li><strong>프로젝트:</strong> {{projectName}}</li><li><strong>거부 사유:</strong> {{approvalNotes}}</li></ul>', '프로젝트 요청 거부 시 발송', 'projectName, approvalNotes', true),
('MANAGER_ASSIGNED', '담당자 배정', '[배정] {{requestTitle}}', '<h2>새로운 요청이 배정되었습니다</h2><p>서비스 요청이 귀하에게 배정되었습니다.</p><ul><li><strong>요청 ID:</strong> {{requestId}}</li><li><strong>제목:</strong> {{requestTitle}}</li></ul><p>시스템에서 확인 후 처리해주세요.</p>', '담당자 배정 시 발송', 'requestTitle, requestId', true)
ON CONFLICT (template_code) DO NOTHING;
