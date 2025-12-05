package com.example.customerservice.controller;

import com.example.customerservice.dto.AttachmentDTO;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.User;
import com.example.customerservice.service.AttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private UserMapper userMapper;

    @PostMapping("/upload")
    public ResponseEntity<AttachmentDTO> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String userId = authentication.getName();
        User user = userMapper.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AttachmentDTO attachment = attachmentService.uploadFile(file, user.getId());
        return ResponseEntity.ok(attachment);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttachmentDTO> getAttachment(@PathVariable Long id) {
        AttachmentDTO attachment = attachmentService.getAttachmentById(id);
        return ResponseEntity.ok(attachment);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id, HttpServletRequest request) {
        Resource resource = attachmentService.loadFileAsResource(id);
        AttachmentDTO attachment = attachmentService.getAttachmentById(id);

        String contentType = attachment.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + attachment.getOriginalFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/service-request/{serviceRequestId}")
    public ResponseEntity<List<AttachmentDTO>> getServiceRequestAttachments(
            @PathVariable Long serviceRequestId) {
        List<AttachmentDTO> attachments = attachmentService.getAttachmentsByServiceRequestId(serviceRequestId);
        return ResponseEntity.ok(attachments);
    }

    @GetMapping("/comment/{commentId}")
    public ResponseEntity<List<AttachmentDTO>> getCommentAttachments(
            @PathVariable Long commentId) {
        List<AttachmentDTO> attachments = attachmentService.getAttachmentsByCommentId(commentId);
        return ResponseEntity.ok(attachments);
    }

    @PostMapping("/link/service-request")
    public ResponseEntity<Void> linkToServiceRequest(
            @RequestParam Long serviceRequestId,
            @RequestParam Long attachmentId) {
        attachmentService.linkToServiceRequest(serviceRequestId, attachmentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/link/comment")
    public ResponseEntity<Void> linkToComment(
            @RequestParam Long commentId,
            @RequestParam Long attachmentId) {
        attachmentService.linkToComment(commentId, attachmentId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.ok().build();
    }
}
