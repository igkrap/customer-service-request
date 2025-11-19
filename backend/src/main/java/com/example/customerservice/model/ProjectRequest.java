package com.example.customerservice.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequest {

    private Long id;

    @NotNull(message = "Requested by user is required")
    private Long requestedByUserId;

    @NotNull(message = "Company is required")
    private Long companyId;

    @NotBlank(message = "Project name is required")
    private String projectName;

    @NotNull(message = "Service type is required")
    private Project.ServiceType serviceType;

    @NotNull(message = "Contract start date is required")
    private LocalDate contractStartDate;

    @NotNull(message = "Contract end date is required")
    private LocalDate contractEndDate;

    @NotNull(message = "Contract man-days is required")
    private BigDecimal contractManDays;

    private RequestStatus requestStatus;

    private Long approvedByUserId;

    private String approvalNotes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum RequestStatus {
        PENDING,    // 대기
        APPROVED,   // 승인
        REJECTED    // 거절
    }
}
