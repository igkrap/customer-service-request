package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestHistoryDTO {
    private Long id;
    private Long serviceRequestId;
    private String eventType;
    private String fromStatus;
    private String toStatus;
    private Long fromManagerId;
    private Long toManagerId;
    private String note;
    private Long createdByUserId;
    private LocalDateTime createdAt;
}
