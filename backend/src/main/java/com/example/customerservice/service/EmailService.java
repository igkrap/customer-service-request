package com.example.customerservice.service;

import com.example.customerservice.mapper.EmailSettingsMapper;
import com.example.customerservice.model.EmailSettings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailSettingsMapper emailSettingsMapper;

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
            helper.setText(body, false); // false = Plain text

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
        String subject = "Test Email";
        String body = "This is a test email. Your email configuration is working.";
        sendEmail(to, subject, body);
    }

    // Service Request Created - Notify Manager
    public void sendServiceRequestCreatedEmail(String managerEmail, String requestTitle, Long requestId) {
        try {
            String subject = "New Request: " + requestTitle;
            String body = "New service request ID " + requestId + " has been assigned to you.\nTitle: " + requestTitle;
            sendEmail(managerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send service request created email", e);
        }
    }

    // Service Request Status Changed - Notify Customer
    public void sendServiceRequestStatusChangedEmail(String customerEmail, String requestTitle, String oldStatus, String newStatus) {
        try {
            String subject = "Status Update: " + requestTitle;
            String body = "Your service request status has been updated.\nTitle: " + requestTitle + "\nStatus: " + oldStatus + " -> " + newStatus;
            sendEmail(customerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send status changed email", e);
        }
    }

    // Service Request Resolved - Notify Customer
    public void sendServiceRequestResolvedEmail(String customerEmail, String requestTitle, String resolutionNotes) {
        try {
            String subject = "Resolved: " + requestTitle;
            String body = "Your service request has been resolved.\nTitle: " + requestTitle + "\nNotes: " + (resolutionNotes != null ? resolutionNotes : "N/A");
            sendEmail(customerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send request resolved email", e);
        }
    }

    // User Approved - Notify User
    public void sendUserApprovedEmail(String userEmail, String username) {
        try {
            String subject = "Account Approved";
            String body = "Hello " + username + ", your account has been approved. You can now log in.";
            sendEmail(userEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send user approved email", e);
        }
    }

    // User Rejected - Notify User
    public void sendUserRejectedEmail(String userEmail, String username) {
        try {
            String subject = "Account Registration";
            String body = "Hello " + username + ", your account registration has been rejected. Please contact the administrator.";
            sendEmail(userEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send user rejected email", e);
        }
    }

    // Project Request Approved - Notify Requester
    public void sendProjectRequestApprovedEmail(String requesterEmail, String projectName) {
        try {
            String subject = "Project Approved: " + projectName;
            String body = "Your project request has been approved.\nProject: " + projectName;
            sendEmail(requesterEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send project approved email", e);
        }
    }

    // Project Request Rejected - Notify Requester
    public void sendProjectRequestRejectedEmail(String requesterEmail, String projectName, String approvalNotes) {
        try {
            String subject = "Project Rejected: " + projectName;
            String body = "Your project request has been rejected.\nProject: " + projectName + "\nReason: " + (approvalNotes != null ? approvalNotes : "N/A");
            sendEmail(requesterEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send project rejected email", e);
        }
    }

    // Manager Assigned - Notify Manager
    public void sendManagerAssignedEmail(String managerEmail, String requestTitle, Long requestId) {
        try {
            String subject = "Assigned: " + requestTitle;
            String body = "You have been assigned to service request ID " + requestId + ".\nTitle: " + requestTitle;
            sendEmail(managerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send manager assigned email", e);
        }
    }
}
