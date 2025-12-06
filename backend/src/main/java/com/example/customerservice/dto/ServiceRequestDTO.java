package com.example.customerservice.dto;

import com.example.customerservice.model.ServiceRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestDTO {
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private ServiceRequest.RequestStatus status;

    private ServiceRequest.Priority priority;

    private Long customerId;

    private String customerName;

    private Long managerId;
    private String managerName;

    private Long projectId;
    private String projectName;

    private Long createdByUserId;

    private Long parentId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    private Double hoursSpent;
    private String resolutionNotes;

    private String dueDate;

    private List<AttachmentDTO> attachments;
    private List<ServiceRequestDTO> followUpRequests;
}
