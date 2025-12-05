package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestCommentDTO {
    private Long id;
    private Long serviceRequestId;
    private Long userId;
    private String username;
    private String commentText;
    private Boolean isInternal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttachmentDTO> attachments;
}
