package com.example.customerservice.controller;

import com.example.customerservice.dto.EmailSettingsDTO;
import com.example.customerservice.dto.TestEmailRequest;
import com.example.customerservice.model.EmailSettings;
import com.example.customerservice.service.EmailService;
import com.example.customerservice.service.EmailSettingsService;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/email-settings")
@RequiredArgsConstructor
public class EmailSettingsController {

    private final EmailSettingsService emailSettingsService;
    private final EmailService emailService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailSettings> createEmailSettings(@Valid @RequestBody EmailSettingsDTO dto) {
        EmailSettings created = emailSettingsService.createEmailSettings(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailSettings> getEmailSettingsById(@PathVariable Long id) {
        EmailSettings settings = emailSettingsService.getEmailSettingsById(id);
        if (settings == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(settings);
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailSettings> getActiveEmailSettings() {
        EmailSettings settings = emailSettingsService.getActiveEmailSettings();
        if (settings == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(settings);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmailSettings>> getAllEmailSettings() {
        List<EmailSettings> settings = emailSettingsService.getAllEmailSettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailSettings> updateEmailSettings(@PathVariable Long id,
                                                               @Valid @RequestBody EmailSettingsDTO dto) {
        try {
            EmailSettings updated = emailSettingsService.updateEmailSettings(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEmailSettings(@PathVariable Long id) {
        emailSettingsService.deleteEmailSettings(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> sendTestEmail(@Valid @RequestBody TestEmailRequest request) {
        Map<String, String> response = new HashMap<>();
        try {
            emailService.sendTestEmail(request.getToEmail());
            response.put("message", "Test email sent successfully to " + request.getToEmail());
            return ResponseEntity.ok(response);
        } catch (MessagingException e) {
            response.put("error", "Failed to send test email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
