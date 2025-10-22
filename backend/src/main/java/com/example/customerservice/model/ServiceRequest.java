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

    private String assignedTo;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;

    // For DTO conversion - not stored in DB
    private transient Customer customer;

    public enum RequestStatus {
        OPEN, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
