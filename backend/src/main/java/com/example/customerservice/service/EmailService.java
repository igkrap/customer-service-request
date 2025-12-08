package com.example.customerservice.service;

import com.example.customerservice.mapper.EmailSettingsMapper;
import com.example.customerservice.model.EmailSettings;
import com.example.customerservice.model.EmailTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailSettingsMapper emailSettingsMapper;
    private final EmailTemplateService emailTemplateService;

    private JavaMailSenderImpl createMailSender(EmailSettings settings) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(settings.getSmtpHost());
        mailSender.setPort(settings.getSmtpPort());
        mailSender.setUsername(settings.getSmtpUsername());
        mailSender.setPassword(settings.getSmtpPassword());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", settings.getUseTls() ? "true" : "false");
        props.put("mail.smtp.ssl.enable", settings.getUseSsl() ? "true" : "false");
        props.put("mail.debug", "true");

        return mailSender;
    }

    public void sendEmail(String to, String subject, String body) throws MessagingException {
        EmailSettings settings = emailSettingsMapper.getActiveEmailSettings();

        if (settings == null || !settings.getEnabled()) {
            log.warn("Email settings not configured or disabled. Email not sent.");
            throw new MessagingException("Email settings not configured or disabled");
        }

        log.info("=== Email Sending Started ===");
        log.info("To: {}", to);
        log.info("Subject: {}", subject);
        log.info("SMTP Host: {}", settings.getSmtpHost());
        log.info("SMTP Port: {}", settings.getSmtpPort());
        log.info("SMTP Username: {}", settings.getSmtpUsername());
        log.info("From Email: {}", settings.getFromEmail());
        log.info("TLS: {}, SSL: {}", settings.getUseTls(), settings.getUseSsl());

        try {
            JavaMailSenderImpl mailSender = createMailSender(settings);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(settings.getFromEmail(), settings.getFromName() != null ? settings.getFromName() : settings.getFromEmail());
            helper.setTo(to);
            helper.setSubject(subject);

            // Wrap body in complete HTML structure with UTF-8 charset for proper Korean rendering
            String htmlBody = "<!DOCTYPE html>" +
                    "<html lang=\"ko\">" +
                    "<head>" +
                    "<meta charset=\"UTF-8\">" +
                    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                    "<style>" +
                    "body { font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    "h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }" +
                    "ul { list-style-type: none; padding-left: 0; }" +
                    "li { padding: 5px 0; }" +
                    "strong { color: #2980b9; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    body +
                    "</body>" +
                    "</html>";

            helper.setText(htmlBody, true); // true = HTML email

            log.info("Attempting to send email...");
            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send email to: {}", to);
            log.error("Error type: {}", e.getClass().getName());
            log.error("Error message: {}", e.getMessage());
            log.error("Full stack trace:", e);
            throw new MessagingException("Failed to send email: " + e.getMessage(), e);
        }
    }

    public void sendTestEmail(String to) throws MessagingException {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("TEST_EMAIL");

            if (!template.getEnabled()) {
                log.info("Template TEST_EMAIL is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("toEmail", to);

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(to, subject, body);
        } catch (RuntimeException e) {
            // Fallback if template not found
            String subject = "Test Email";
            String body = "This is a test email. Your email configuration is working.";
            sendEmail(to, subject, body);
        }
    }

    // Service Request Created - Notify Manager
    public void sendServiceRequestCreatedEmail(String managerEmail, String requestTitle, Long requestId) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("SERVICE_REQUEST_CREATED");

            if (!template.getEnabled()) {
                log.info("Template SERVICE_REQUEST_CREATED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("requestTitle", requestTitle);
            variables.put("requestId", String.valueOf(requestId));

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(managerEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send service request created email", e);
        }
    }

    // Service Request Status Changed - Notify Customer
    public void sendServiceRequestStatusChangedEmail(String customerEmail, String requestTitle, String oldStatus, String newStatus) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("SERVICE_REQUEST_STATUS_CHANGED");

            if (!template.getEnabled()) {
                log.info("Template SERVICE_REQUEST_STATUS_CHANGED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("requestTitle", requestTitle);
            variables.put("oldStatus", oldStatus);
            variables.put("newStatus", newStatus);

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(customerEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send status changed email", e);
        }
    }

    // Service Request Resolved - Notify Customer
    public void sendServiceRequestResolvedEmail(String customerEmail, String requestTitle, String resolutionNotes) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("SERVICE_REQUEST_RESOLVED");

            if (!template.getEnabled()) {
                log.info("Template SERVICE_REQUEST_RESOLVED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("requestTitle", requestTitle);
            variables.put("resolutionNotes", resolutionNotes != null ? resolutionNotes : "N/A");

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(customerEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send request resolved email", e);
        }
    }

    // User Approved - Notify User
    public void sendUserApprovedEmail(String userEmail, String username) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("USER_APPROVED");

            if (!template.getEnabled()) {
                log.info("Template USER_APPROVED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("username", username);

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(userEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send user approved email", e);
        }
    }

    // User Rejected - Notify User
    public void sendUserRejectedEmail(String userEmail, String username) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("USER_REJECTED");

            if (!template.getEnabled()) {
                log.info("Template USER_REJECTED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("username", username);

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(userEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send user rejected email", e);
        }
    }

    // Project Request Approved - Notify Requester
    public void sendProjectRequestApprovedEmail(String requesterEmail, String projectName) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("PROJECT_REQUEST_APPROVED");

            if (!template.getEnabled()) {
                log.info("Template PROJECT_REQUEST_APPROVED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("projectName", projectName);

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(requesterEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send project approved email", e);
        }
    }

    // Project Request Rejected - Notify Requester
    public void sendProjectRequestRejectedEmail(String requesterEmail, String projectName, String approvalNotes) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("PROJECT_REQUEST_REJECTED");

            if (!template.getEnabled()) {
                log.info("Template PROJECT_REQUEST_REJECTED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("projectName", projectName);
            variables.put("approvalNotes", approvalNotes != null ? approvalNotes : "N/A");

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(requesterEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send project rejected email", e);
        }
    }

    // Manager Assigned - Notify Manager
    public void sendManagerAssignedEmail(String managerEmail, String requestTitle, Long requestId) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode("MANAGER_ASSIGNED");

            if (!template.getEnabled()) {
                log.info("Template MANAGER_ASSIGNED is disabled. Email not sent.");
                return;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("requestTitle", requestTitle);
            variables.put("requestId", String.valueOf(requestId));

            String subject = emailTemplateService.processTemplate(template.getSubject(), variables);
            String body = emailTemplateService.processTemplate(template.getBody(), variables);

            sendEmail(managerEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send manager assigned email", e);
        }
    }
}
