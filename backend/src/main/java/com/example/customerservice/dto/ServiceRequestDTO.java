package com.example.customerservice.dto;

import com.example.customerservice.model.ServiceRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestDTO {
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Status is required")
    private ServiceRequest.RequestStatus status;

    @NotNull(message = "Priority is required")
    private ServiceRequest.Priority priority;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private String customerName;
    private String customerEmail;

    private String assignedTo;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
