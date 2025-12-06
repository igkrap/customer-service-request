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
            return;
        }

        try {
            JavaMailSenderImpl mailSender = createMailSender(settings);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(settings.getFromEmail(), settings.getFromName() != null ? settings.getFromName() : settings.getFromEmail());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
            throw new MessagingException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendTestEmail(String to) throws MessagingException {
        String subject = "Test Email from Customer Service System";
        String body = "<html><body>" +
                "<h2>Test Email</h2>" +
                "<p>This is a test email from the Customer Service Request Management System.</p>" +
                "<p>If you receive this email, your SMTP configuration is working correctly.</p>" +
                "</body></html>";
        sendEmail(to, subject, body);
    }

    // Service Request Created - Notify Manager
    public void sendServiceRequestCreatedEmail(String managerEmail, String requestTitle, Long requestId) {
        try {
            String subject = "New Service Request Assigned: " + requestTitle;
            String body = "<html><body>" +
                    "<h2>New Service Request Assigned</h2>" +
                    "<p>A new service request has been assigned to you.</p>" +
                    "<p><strong>Request ID:</strong> " + requestId + "</p>" +
                    "<p><strong>Title:</strong> " + requestTitle + "</p>" +
                    "<p>Please log in to the system to view details.</p>" +
                    "</body></html>";
            sendEmail(managerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send service request created email", e);
        }
    }

    // Service Request Status Changed - Notify Customer
    public void sendServiceRequestStatusChangedEmail(String customerEmail, String requestTitle, String oldStatus, String newStatus) {
        try {
            String subject = "Service Request Status Updated: " + requestTitle;
            String body = "<html><body>" +
                    "<h2>Service Request Status Updated</h2>" +
                    "<p>The status of your service request has been updated.</p>" +
                    "<p><strong>Title:</strong> " + requestTitle + "</p>" +
                    "<p><strong>Previous Status:</strong> " + oldStatus + "</p>" +
                    "<p><strong>New Status:</strong> " + newStatus + "</p>" +
                    "<p>Please log in to the system to view details.</p>" +
                    "</body></html>";
            sendEmail(customerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send status changed email", e);
        }
    }

    // Service Request Resolved - Notify Customer
    public void sendServiceRequestResolvedEmail(String customerEmail, String requestTitle, String resolutionNotes) {
        try {
            String subject = "Service Request Resolved: " + requestTitle;
            String body = "<html><body>" +
                    "<h2>Service Request Resolved</h2>" +
                    "<p>Your service request has been resolved.</p>" +
                    "<p><strong>Title:</strong> " + requestTitle + "</p>" +
                    "<p><strong>Resolution Notes:</strong></p>" +
                    "<p>" + (resolutionNotes != null ? resolutionNotes : "No notes provided") + "</p>" +
                    "<p>Please log in to the system to review the resolution.</p>" +
                    "</body></html>";
            sendEmail(customerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send request resolved email", e);
        }
    }

    // User Approved - Notify User
    public void sendUserApprovedEmail(String userEmail, String username) {
        try {
            String subject = "Your Account Has Been Approved";
            String body = "<html><body>" +
                    "<h2>Welcome to Customer Service Request Management System</h2>" +
                    "<p>Hello " + username + ",</p>" +
                    "<p>Your account has been approved. You can now log in and start using the system.</p>" +
                    "<p>Thank you for joining us!</p>" +
                    "</body></html>";
            sendEmail(userEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send user approved email", e);
        }
    }

    // User Rejected - Notify User
    public void sendUserRejectedEmail(String userEmail, String username) {
        try {
            String subject = "Account Registration Status";
            String body = "<html><body>" +
                    "<h2>Account Registration Update</h2>" +
                    "<p>Hello " + username + ",</p>" +
                    "<p>We regret to inform you that your account registration has been rejected.</p>" +
                    "<p>If you have any questions, please contact the administrator.</p>" +
                    "</body></html>";
            sendEmail(userEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send user rejected email", e);
        }
    }

    // Project Request Approved - Notify Requester
    public void sendProjectRequestApprovedEmail(String requesterEmail, String projectName) {
        try {
            String subject = "Project Request Approved: " + projectName;
            String body = "<html><body>" +
                    "<h2>Project Request Approved</h2>" +
                    "<p>Your project request has been approved.</p>" +
                    "<p><strong>Project Name:</strong> " + projectName + "</p>" +
                    "<p>The project is now available in the system.</p>" +
                    "</body></html>";
            sendEmail(requesterEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send project approved email", e);
        }
    }

    // Project Request Rejected - Notify Requester
    public void sendProjectRequestRejectedEmail(String requesterEmail, String projectName, String approvalNotes) {
        try {
            String subject = "Project Request Rejected: " + projectName;
            String body = "<html><body>" +
                    "<h2>Project Request Rejected</h2>" +
                    "<p>Your project request has been rejected.</p>" +
                    "<p><strong>Project Name:</strong> " + projectName + "</p>" +
                    "<p><strong>Reason:</strong></p>" +
                    "<p>" + (approvalNotes != null ? approvalNotes : "No reason provided") + "</p>" +
                    "</body></html>";
            sendEmail(requesterEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send project rejected email", e);
        }
    }

    // Manager Assigned - Notify Manager
    public void sendManagerAssignedEmail(String managerEmail, String requestTitle, Long requestId) {
        try {
            String subject = "You've Been Assigned to Service Request: " + requestTitle;
            String body = "<html><body>" +
                    "<h2>Service Request Assignment</h2>" +
                    "<p>You have been assigned to a service request.</p>" +
                    "<p><strong>Request ID:</strong> " + requestId + "</p>" +
                    "<p><strong>Title:</strong> " + requestTitle + "</p>" +
                    "<p>Please log in to the system to view details and take action.</p>" +
                    "</body></html>";
            sendEmail(managerEmail, subject, body);
        } catch (MessagingException e) {
            log.error("Failed to send manager assigned email", e);
        }
    }
}
