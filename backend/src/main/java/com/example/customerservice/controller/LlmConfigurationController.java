package com.example.customerservice.controller;

import com.example.customerservice.dto.LlmConfigurationDTO;
import com.example.customerservice.model.LlmConfiguration;
import com.example.customerservice.service.LlmConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/llm-configurations")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class LlmConfigurationController {

    private final LlmConfigurationService llmConfigurationService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LlmConfiguration> createLlmConfiguration(@Valid @RequestBody LlmConfigurationDTO dto) {
        LlmConfiguration created = llmConfigurationService.createLlmConfiguration(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LlmConfiguration> getLlmConfigurationById(@PathVariable Long id) {
        LlmConfiguration config = llmConfigurationService.getLlmConfigurationById(id);
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config);
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LlmConfiguration> getActiveLlmConfiguration() {
        LlmConfiguration config = llmConfigurationService.getActiveLlmConfiguration();
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LlmConfiguration>> getAllLlmConfigurations() {
        List<LlmConfiguration> configs = llmConfigurationService.getAllLlmConfigurations();
        return ResponseEntity.ok(configs);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LlmConfiguration> updateLlmConfiguration(@PathVariable Long id,
                                                                     @Valid @RequestBody LlmConfigurationDTO dto) {
        try {
            LlmConfiguration updated = llmConfigurationService.updateLlmConfiguration(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLlmConfiguration(@PathVariable Long id) {
        llmConfigurationService.deleteLlmConfiguration(id);
        return ResponseEntity.noContent().build();
    }
}
