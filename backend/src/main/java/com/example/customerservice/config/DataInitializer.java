package com.example.customerservice.config;

import com.example.customerservice.mapper.EmailTemplateMapper;
import com.example.customerservice.mapper.RagDocumentMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.EmailTemplate;
import com.example.customerservice.model.RagDocument;
import com.example.customerservice.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailTemplateMapper emailTemplateMapper;

    @Autowired
    private RagDocumentMapper ragDocumentMapper;

    @Override
    public void run(String... args) throws Exception {
        // Check and create/update admin user
        if (!userMapper.existsByUserId("admin")) {
            User admin = new User();
            admin.setUserId("admin");
            admin.setUsername("관리자");
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode("1234"));
            admin.setRole(User.Role.ROLE_ADMIN);
            admin.setApprovalStatus(User.ApprovalStatus.APPROVED);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userMapper.insert(admin);
            System.out.println("Admin user created: admin / 1234");
        } else {
            // Update existing admin user to ensure role is set
            User admin = userMapper.findByUserId("admin").orElse(null);
            if (admin != null && admin.getRole() == null) {
                admin.setRole(User.Role.ROLE_ADMIN);
                admin.setApprovalStatus(User.ApprovalStatus.APPROVED);
                admin.setUpdatedAt(LocalDateTime.now());
                userMapper.update(admin);
                System.out.println("Admin user role updated to ROLE_ADMIN");
            }
        }

        // Check and create/update manager user
        if (!userMapper.existsByUserId("manager")) {
            User manager = new User();
            manager.setUserId("manager");
            manager.setUsername("매니저");
            manager.setEmail("manager@example.com");
            manager.setPassword(passwordEncoder.encode("1234"));
            manager.setRole(User.Role.ROLE_MANAGER);
            manager.setApprovalStatus(User.ApprovalStatus.APPROVED);
            manager.setCreatedAt(LocalDateTime.now());
            manager.setUpdatedAt(LocalDateTime.now());
            userMapper.insert(manager);
            System.out.println("Manager user created: manager / 1234");
        } else {
            // Update existing manager user to ensure role is set
            User manager = userMapper.findByUserId("manager").orElse(null);
            if (manager != null && manager.getRole() == null) {
                manager.setRole(User.Role.ROLE_MANAGER);
                manager.setApprovalStatus(User.ApprovalStatus.APPROVED);
                manager.setUpdatedAt(LocalDateTime.now());
                userMapper.update(manager);
                System.out.println("Manager user role updated to ROLE_MANAGER");
            }
        }

        // Check and create/update customer user
        if (!userMapper.existsByUserId("customer")) {
            User customer = new User();
            customer.setUserId("customer");
            customer.setUsername("고객");
            customer.setEmail("customer@example.com");
            customer.setPassword(passwordEncoder.encode("1234"));
            customer.setRole(User.Role.ROLE_CUSTOMER);
            customer.setApprovalStatus(User.ApprovalStatus.APPROVED);
            customer.setCreatedAt(LocalDateTime.now());
            customer.setUpdatedAt(LocalDateTime.now());
            userMapper.insert(customer);
            System.out.println("Customer user created: customer / 1234");
        } else {
            // Update existing customer user to ensure role is set
            User customer = userMapper.findByUserId("customer").orElse(null);
            if (customer != null && customer.getRole() == null) {
                customer.setRole(User.Role.ROLE_CUSTOMER);
                customer.setApprovalStatus(User.ApprovalStatus.APPROVED);
                customer.setUpdatedAt(LocalDateTime.now());
                userMapper.update(customer);
                System.out.println("Customer user role updated to ROLE_CUSTOMER");
            }
        }

        // Initialize email templates
        log.info("Initializing default email templates...");
        initializeEmailTemplates();
        log.info("Email templates initialization completed.");

        // Initialize sample FAQ documents
        log.info("Initializing sample FAQ documents for RAG...");
        try {
            initializeSampleFAQDocuments();
            log.info("Sample FAQ documents initialization completed.");
        } catch (Exception e) {
            log.warn("Failed to initialize sample FAQ documents (pgvector may not be available): " + e.getMessage());
        }
    }

    private void initializeEmailTemplates() {
        // Test Email
        createOrUpdateTemplate(
            "TEST_EMAIL",
            "테스트 이메일",
            "테스트 이메일",
            "<h2>테스트 이메일</h2><p>이메일 설정이 정상적으로 작동하고 있습니다.</p><p>수신 이메일: <strong>{{toEmail}}</strong></p>",
            "이메일 설정 테스트용 템플릿",
            "toEmail"
        );

        // Service Request Created
        createOrUpdateTemplate(
            "SERVICE_REQUEST_CREATED",
            "서비스 요청 생성",
            "[새 요청] {{requestTitle}}",
            "<h2>새로운 서비스 요청이 배정되었습니다</h2><p>새로운 서비스 요청이 귀하에게 배정되었습니다.</p><ul><li><strong>요청 ID:</strong> {{requestId}}</li><li><strong>제목:</strong> {{requestTitle}}</li></ul><p>시스템에 로그인하여 자세한 내용을 확인해주세요.</p>",
            "담당자에게 새 서비스 요청 생성 시 발송",
            "requestTitle, requestId"
        );

        // Service Request Status Changed
        createOrUpdateTemplate(
            "SERVICE_REQUEST_STATUS_CHANGED",
            "서비스 요청 상태 변경",
            "[상태 변경] {{requestTitle}}",
            "<h2>서비스 요청 상태가 변경되었습니다</h2><p>귀하의 서비스 요청 상태가 업데이트되었습니다.</p><ul><li><strong>제목:</strong> {{requestTitle}}</li><li><strong>상태 변경:</strong> {{oldStatus}} → {{newStatus}}</li></ul><p>자세한 내용은 시스템에서 확인해주세요.</p>",
            "고객에게 요청 상태 변경 시 발송",
            "requestTitle, oldStatus, newStatus"
        );

        // Service Request Resolved
        createOrUpdateTemplate(
            "SERVICE_REQUEST_RESOLVED",
            "서비스 요청 완료",
            "[완료] {{requestTitle}}",
            "<h2>서비스 요청이 완료되었습니다</h2><p>귀하의 서비스 요청이 성공적으로 처리되었습니다.</p><ul><li><strong>제목:</strong> {{requestTitle}}</li><li><strong>처리 내용:</strong> {{resolutionNotes}}</li></ul><p>감사합니다.</p>",
            "고객에게 요청 완료 시 발송",
            "requestTitle, resolutionNotes"
        );

        // User Approved
        createOrUpdateTemplate(
            "USER_APPROVED",
            "사용자 승인",
            "계정이 승인되었습니다",
            "<h2>계정 승인 완료</h2><p>안녕하세요, <strong>{{username}}</strong>님</p><p>귀하의 계정이 승인되었습니다. 이제 시스템에 로그인하실 수 있습니다.</p><p>감사합니다.</p>",
            "사용자 계정 승인 시 발송",
            "username"
        );

        // User Rejected
        createOrUpdateTemplate(
            "USER_REJECTED",
            "사용자 거부",
            "계정 등록 거부",
            "<h2>계정 등록 거부</h2><p>안녕하세요, <strong>{{username}}</strong>님</p><p>귀하의 계정 등록이 거부되었습니다. 자세한 사항은 관리자에게 문의해주세요.</p>",
            "사용자 계정 거부 시 발송",
            "username"
        );

        // Project Request Approved
        createOrUpdateTemplate(
            "PROJECT_REQUEST_APPROVED",
            "프로젝트 요청 승인",
            "[승인] {{projectName}}",
            "<h2>프로젝트 요청이 승인되었습니다</h2><p>귀하의 프로젝트 요청이 승인되었습니다.</p><ul><li><strong>프로젝트:</strong> {{projectName}}</li></ul><p>프로젝트를 진행해주세요.</p>",
            "프로젝트 요청 승인 시 발송",
            "projectName"
        );

        // Project Request Rejected
        createOrUpdateTemplate(
            "PROJECT_REQUEST_REJECTED",
            "프로젝트 요청 거부",
            "[거부] {{projectName}}",
            "<h2>프로젝트 요청이 거부되었습니다</h2><p>귀하의 프로젝트 요청이 거부되었습니다.</p><ul><li><strong>프로젝트:</strong> {{projectName}}</li><li><strong>거부 사유:</strong> {{approvalNotes}}</li></ul>",
            "프로젝트 요청 거부 시 발송",
            "projectName, approvalNotes"
        );

        // Manager Assigned
        createOrUpdateTemplate(
            "MANAGER_ASSIGNED",
            "담당자 배정",
            "[배정] {{requestTitle}}",
            "<h2>새로운 요청이 배정되었습니다</h2><p>서비스 요청이 귀하에게 배정되었습니다.</p><ul><li><strong>요청 ID:</strong> {{requestId}}</li><li><strong>제목:</strong> {{requestTitle}}</li></ul><p>시스템에서 확인 후 처리해주세요.</p>",
            "담당자 배정 시 발송",
            "requestTitle, requestId"
        );
    }

    private void createOrUpdateTemplate(String templateCode, String templateName, String subject,
                                       String body, String description, String variables) {
        try {
            // Check if template exists
            var existingTemplate = emailTemplateMapper.findByTemplateCode(templateCode);

            if (existingTemplate.isPresent()) {
                // Update existing template
                EmailTemplate template = existingTemplate.get();
                template.setTemplateName(templateName);
                template.setSubject(subject);
                template.setBody(body);
                template.setDescription(description);
                template.setVariables(variables);
                emailTemplateMapper.update(template);
                log.debug("Updated email template: {}", templateCode);
            } else {
                // Create new template
                EmailTemplate template = new EmailTemplate();
                template.setTemplateCode(templateCode);
                template.setTemplateName(templateName);
                template.setSubject(subject);
                template.setBody(body);
                template.setDescription(description);
                template.setVariables(variables);
                template.setEnabled(true);
                emailTemplateMapper.insert(template);
                log.info("Created email template: {}", templateCode);
            }
        } catch (Exception e) {
            log.error("Failed to initialize email template: {}", templateCode, e);
        }
    }

    private void initializeSampleFAQDocuments() {
        // Get admin user ID
        User admin = userMapper.findByUserId("admin").orElse(null);
        if (admin == null) {
            log.warn("Admin user not found, skipping FAQ initialization");
            return;
        }

        // FAQ 1: 서비스 요청 프로세스
        createSampleFAQ(
            "서비스 요청 프로세스 안내",
            """
            # 서비스 요청 프로세스

            ## 1. 서비스 요청 등록
            - 좌측 메뉴에서 "서비스 요청 등록" 또는 "서비스 요청 처리" 클릭
            - 제목, 설명, 우선순위를 입력합니다
            - 필요시 첨부파일을 추가할 수 있습니다
            - 프로젝트를 선택합니다 (배정된 프로젝트 중 선택)

            ## 2. 담당자 배정
            - 시스템이 자동으로 담당 매니저를 배정합니다
            - 매니저에게 이메일 알림이 전송됩니다

            ## 3. 진행 상태
            - OPEN: 새로 등록된 상태
            - IN_PROGRESS: 처리 중인 상태
            - RESOLVED: 완료된 상태
            - ON_HOLD: 대기 중인 상태
            - CANCELLED: 취소된 상태

            ## 4. 완료 처리
            - 매니저가 문제를 해결하면 RESOLVED 상태로 변경됩니다
            - 고객에게 완료 알림이 전송됩니다
            """,
            "FAQ",
            admin.getId()
        );

        // FAQ 2: 우선순위 설정 가이드
        createSampleFAQ(
            "우선순위 설정 가이드",
            """
            # 서비스 요청 우선순위

            ## CRITICAL (긴급)
            - 시스템 전체가 다운된 경우
            - 비즈니스 핵심 기능이 작동하지 않는 경우
            - 보안 위험이 있는 경우
            - 즉시 처리가 필요합니다

            ## HIGH (높음)
            - 중요 기능에 심각한 버그가 있는 경우
            - 많은 사용자에게 영향을 주는 문제
            - 빠른 처리가 필요합니다

            ## MEDIUM (보통)
            - 일반적인 버그 수정
            - 기능 개선 요청
            - 일부 사용자에게 영향을 주는 문제

            ## LOW (낮음)
            - 사소한 UI 개선
            - 문서 수정 요청
            - 비즈니스에 영향이 적은 문제
            """,
            "FAQ",
            admin.getId()
        );

        // FAQ 3: 프로젝트 등록 절차
        createSampleFAQ(
            "프로젝트 등록 절차",
            """
            # 프로젝트 등록 프로세스

            ## 고객의 프로젝트 등록 요청
            1. "프로젝트 등록 요청" 메뉴 클릭
            2. 프로젝트 정보 입력:
               - 프로젝트명
               - 서비스 타입 (유지보수, 장애 수리, 기타)
               - 계약 시작일/종료일
               - 계약 M/M (Man-Month)
            3. 요청 제출

            ## 관리자 승인 절차
            1. 관리자가 "프로젝트 요청 승인" 메뉴에서 확인
            2. 요청 내용 검토
            3. 승인 또는 거부 처리
            4. 승인 시 프로젝트가 자동 생성됩니다

            ## 프로젝트 배정
            - 관리자가 "사용자별 프로젝트 등록"에서 사용자에게 프로젝트 배정
            - 배정된 사용자만 해당 프로젝트의 서비스 요청을 등록할 수 있습니다
            """,
            "FAQ",
            admin.getId()
        );

        // FAQ 4: 첨부파일 관리
        createSampleFAQ(
            "첨부파일 업로드 방법",
            """
            # 첨부파일 업로드 가이드

            ## 파일 업로드
            1. 서비스 요청 등록 시 "파일 선택" 버튼 클릭
            2. 로컬 컴퓨터에서 파일 선택
            3. 여러 파일을 선택할 수 있습니다

            ## 지원하는 파일 형식
            - 문서: PDF, DOC, DOCX, XLS, XLSX, TXT
            - 이미지: JPG, PNG, GIF
            - 압축: ZIP, RAR
            - 기타: 모든 파일 형식 지원

            ## 파일 크기 제한
            - 단일 파일: 최대 10MB
            - 전체: 제한 없음

            ## 파일 다운로드
            - 서비스 요청 상세 페이지에서 첨부파일 목록 확인
            - 파일명 클릭하여 다운로드
            """,
            "FAQ",
            admin.getId()
        );

        // FAQ 5: 역할별 권한
        createSampleFAQ(
            "시스템 사용자 역할 및 권한",
            """
            # 사용자 역할 및 권한

            ## ADMIN (관리자)
            - 모든 메뉴 접근 가능
            - 사용자 관리 (승인/거부/역할 변경)
            - 회사 관리
            - 프로젝트 관리
            - 프로젝트 요청 승인
            - 사용자별 프로젝트 배정
            - 이메일 설정 관리
            - LLM 설정 및 RAG 지식베이스 관리
            - 매니저별 처리 현황 조회

            ## MANAGER (매니저)
            - 서비스 요청 처리
            - 배정된 프로젝트의 서비스 요청 확인
            - 서비스 요청 상태 변경
            - 고객 문의 응대

            ## CUSTOMER (고객)
            - 서비스 요청 등록
            - 본인의 서비스 요청 확인
            - 프로젝트 등록 요청
            - 배정된 프로젝트 조회
            """,
            "FAQ",
            admin.getId()
        );

        // FAQ 6: 이메일 알림
        createSampleFAQ(
            "이메일 알림 설정 및 관리",
            """
            # 이메일 알림 시스템

            ## 자동 발송 이메일
            시스템은 다음 이벤트 발생 시 자동으로 이메일을 발송합니다:

            1. **서비스 요청 생성**
               - 담당 매니저에게 알림

            2. **서비스 요청 상태 변경**
               - 요청자에게 상태 변경 알림

            3. **서비스 요청 완료**
               - 요청자에게 완료 알림

            4. **사용자 승인/거부**
               - 신청자에게 결과 알림

            5. **프로젝트 요청 승인/거부**
               - 요청자에게 결과 알림

            ## 이메일 템플릿 관리 (관리자만)
            - "이메일 템플릿 관리" 메뉴에서 템플릿 편집 가능
            - 변수를 사용하여 동적 내용 삽입 가능
            - HTML 형식 지원

            ## SMTP 설정 (관리자만)
            - "이메일 서버 설정"에서 SMTP 정보 입력
            - 테스트 이메일 발송 기능으로 설정 확인 가능
            """,
            "FAQ",
            admin.getId()
        );
    }

    private void createSampleFAQ(String title, String content, String category, Long adminId) {
        try {
            // Check if document with same title already exists
            var existingDocs = ragDocumentMapper.getAllRagDocuments();
            boolean exists = existingDocs.stream()
                .anyMatch(doc -> doc.getTitle().equals(title));

            if (!exists) {
                RagDocument doc = new RagDocument();
                doc.setTitle(title);
                doc.setContent(content);
                doc.setCategory(category);
                doc.setEnabled(false); // Disabled until admin configures LLM and generates embeddings
                doc.setUploadedByUserId(adminId);
                doc.setEmbedding(new float[3072]); // Zero vector placeholder
                doc.setEmbeddingDimension(1536); // Default dimension

                ragDocumentMapper.insertRagDocument(doc);
                log.info("Created sample FAQ document: {}", title);
            }
        } catch (Exception e) {
            log.error("Failed to create sample FAQ document: {}", title, e);
        }
    }
}
