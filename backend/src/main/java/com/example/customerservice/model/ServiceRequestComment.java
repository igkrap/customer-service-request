package com.example.customerservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestComment {
    private Long id;
    private Long serviceRequestId;
    private Long userId;
    private String commentText;
    private Boolean isInternal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
