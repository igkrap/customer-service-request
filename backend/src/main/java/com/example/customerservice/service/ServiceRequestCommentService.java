package com.example.customerservice.service;

import com.example.customerservice.dto.AttachmentDTO;
import com.example.customerservice.dto.ServiceRequestCommentDTO;
import com.example.customerservice.mapper.ServiceRequestCommentMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.ServiceRequestComment;
import com.example.customerservice.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceRequestCommentService {

    @Autowired
    private ServiceRequestCommentMapper commentMapper;

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private UserMapper userMapper;

    @Transactional
    public ServiceRequestCommentDTO createComment(ServiceRequestCommentDTO dto) {
        ServiceRequestComment comment = new ServiceRequestComment();
        comment.setServiceRequestId(dto.getServiceRequestId());
        comment.setUserId(dto.getUserId());
        comment.setCommentText(dto.getCommentText());
        comment.setIsInternal(dto.getIsInternal() != null ? dto.getIsInternal() : false);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        commentMapper.insert(comment);

        // Link attachments if provided
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            for (AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getId() != null) {
                    attachmentService.linkToComment(comment.getId(), attachmentDTO.getId());
                }
            }
        }

        return getCommentById(comment.getId());
    }

    public ServiceRequestCommentDTO getCommentById(Long id) {
        ServiceRequestComment comment = commentMapper.findById(id);
        if (comment == null) {
            throw new RuntimeException("Comment not found with id: " + id);
        }
        return convertToDTO(comment);
    }

    public List<ServiceRequestCommentDTO> getCommentsByServiceRequestId(Long serviceRequestId) {
        List<ServiceRequestComment> comments = commentMapper.findByServiceRequestId(serviceRequestId);
        return comments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceRequestCommentDTO updateComment(Long id, ServiceRequestCommentDTO dto) {
        ServiceRequestComment comment = commentMapper.findById(id);
        if (comment == null) {
            throw new RuntimeException("Comment not found with id: " + id);
        }

        comment.setCommentText(dto.getCommentText());
        comment.setUpdatedAt(LocalDateTime.now());

        commentMapper.update(comment);
        return getCommentById(id);
    }

    @Transactional
    public void deleteComment(Long id) {
        commentMapper.delete(id);
    }

    private ServiceRequestCommentDTO convertToDTO(ServiceRequestComment comment) {
        ServiceRequestCommentDTO dto = new ServiceRequestCommentDTO();
        dto.setId(comment.getId());
        dto.setServiceRequestId(comment.getServiceRequestId());
        dto.setUserId(comment.getUserId());
        dto.setCommentText(comment.getCommentText());
        dto.setIsInternal(comment.getIsInternal());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());

        // Get user information
        if (comment.getUserId() != null) {
            User user = userMapper.findById(comment.getUserId()).orElse(null);
            if (user != null) {
                dto.setUsername(user.getUsername());
            }
        }

        // Get attachments
        List<AttachmentDTO> attachments = attachmentService.getAttachmentsByCommentId(comment.getId());
        dto.setAttachments(attachments);

        return dto;
    }
}
