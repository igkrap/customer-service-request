package com.example.customerservice.controller;

import com.example.customerservice.dto.ServiceRequestCommentDTO;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.User;
import com.example.customerservice.service.ServiceRequestCommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-request-comments")
public class ServiceRequestCommentController {

    @Autowired
    private ServiceRequestCommentService commentService;

    @Autowired
    private UserMapper userMapper;

    @PostMapping
    public ResponseEntity<ServiceRequestCommentDTO> createComment(
            @RequestBody ServiceRequestCommentDTO dto,
            Authentication authentication) {

        String userId = authentication.getName();
        User user = userMapper.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        dto.setUserId(user.getId());

        ServiceRequestCommentDTO createdComment = commentService.createComment(dto);
        return ResponseEntity.ok(createdComment);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequestCommentDTO> getComment(@PathVariable Long id) {
        ServiceRequestCommentDTO comment = commentService.getCommentById(id);
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/service-request/{serviceRequestId}")
    public ResponseEntity<List<ServiceRequestCommentDTO>> getCommentsByServiceRequest(
            @PathVariable Long serviceRequestId) {
        List<ServiceRequestCommentDTO> comments = commentService.getCommentsByServiceRequestId(serviceRequestId);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceRequestCommentDTO> updateComment(
            @PathVariable Long id,
            @RequestBody ServiceRequestCommentDTO dto) {

        ServiceRequestCommentDTO updatedComment = commentService.updateComment(id, dto);
        return ResponseEntity.ok(updatedComment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok().build();
    }
}
