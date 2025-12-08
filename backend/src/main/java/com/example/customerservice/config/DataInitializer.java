package com.example.customerservice.config;

import com.example.customerservice.mapper.EmailTemplateMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.EmailTemplate;
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
}
