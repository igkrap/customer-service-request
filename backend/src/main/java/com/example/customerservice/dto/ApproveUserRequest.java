package com.example.customerservice.dto;

import com.example.customerservice.model.User;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApproveUserRequest {

    @NotNull(message = "Company ID is required")
    private Long companyId;

    @NotNull(message = "Approval status is required")
    private User.ApprovalStatus approvalStatus;
}
