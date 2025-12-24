package com.example.customerservice.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private RequestStatus status;

    private Priority priority;

    private Long customerId;

    private Long managerId;

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

    public enum RequestStatus {
        OPEN, IN_PROGRESS, RESOLVED, HOLD, CANCELLED
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
