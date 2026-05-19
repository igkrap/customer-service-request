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

    private String resolvedAt;

    private String receivedAt;

    private Double hoursSpent;

    private String resolutionNotes;

    private String dueDate;

    private String assignedAt;

    private String startedAt;

    private String closedAt;

    private String cancelledAt;

    private String reopenedAt;

    public enum RequestStatus {
        OPEN,
        TRIAGE,
        ASSIGNED,
        IN_PROGRESS,
        WAITING_CUSTOMER,
        HOLD,
        RESOLVED,
        REOPENED,
        CLOSED,
        CANCELLED
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
