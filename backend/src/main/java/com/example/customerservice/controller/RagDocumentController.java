package com.example.customerservice.controller;

import com.example.customerservice.dto.RagDocumentDTO;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.RagDocument;
import com.example.customerservice.model.User;
import com.example.customerservice.service.RagDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rag-documents")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class RagDocumentController {

    private final RagDocumentService ragDocumentService;
    private final UserMapper userMapper;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RagDocument> createRagDocument(@Valid @RequestBody RagDocumentDTO dto,
                                                          Authentication authentication) {
        String userId = authentication.getName();
        User user = userMapper.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        RagDocument created = ragDocumentService.createRagDocument(dto, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RagDocument> getRagDocumentById(@PathVariable Long id) {
        RagDocument document = ragDocumentService.getRagDocumentById(id);
        if (document == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(document);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RagDocument>> getAllRagDocuments() {
        List<RagDocument> documents = ragDocumentService.getAllRagDocuments();
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/enabled")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RagDocument>> getAllEnabledRagDocuments() {
        List<RagDocument> documents = ragDocumentService.getAllEnabledRagDocuments();
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RagDocument>> getRagDocumentsByCategory(@PathVariable String category) {
        List<RagDocument> documents = ragDocumentService.getRagDocumentsByCategory(category);
        return ResponseEntity.ok(documents);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RagDocument> updateRagDocument(@PathVariable Long id,
                                                          @Valid @RequestBody RagDocumentDTO dto) {
        try {
            RagDocument updated = ragDocumentService.updateRagDocument(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRagDocument(@PathVariable Long id) {
        ragDocumentService.deleteRagDocument(id);
        return ResponseEntity.noContent().build();
    }
}
