package com.example.customerservice.dto;

import com.example.customerservice.model.ServiceRequest;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateServiceRequestStatusRequest {

    @NotNull(message = "Status is required")
    private ServiceRequest.RequestStatus status;
}
