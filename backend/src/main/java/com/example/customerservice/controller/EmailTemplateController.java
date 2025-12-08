package com.example.customerservice.controller;

import com.example.customerservice.dto.EmailTemplateDTO;
import com.example.customerservice.model.EmailTemplate;
import com.example.customerservice.service.EmailTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/email-templates")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplate> createTemplate(@Valid @RequestBody EmailTemplateDTO dto) {
        EmailTemplate created = emailTemplateService.createTemplate(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplate> getTemplateById(@PathVariable Long id) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateById(id);
            return ResponseEntity.ok(template);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplate> getTemplateByCode(@PathVariable String code) {
        try {
            EmailTemplate template = emailTemplateService.getTemplateByCode(code);
            return ResponseEntity.ok(template);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmailTemplate>> getAllTemplates() {
        List<EmailTemplate> templates = emailTemplateService.getAllTemplates();
        return ResponseEntity.ok(templates);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplate> updateTemplate(@PathVariable Long id,
                                                          @Valid @RequestBody EmailTemplateDTO dto) {
        try {
            EmailTemplate updated = emailTemplateService.updateTemplate(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        emailTemplateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }
}
