package com.example.customerservice.dto;

import com.example.customerservice.model.User;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequest {

    @NotNull(message = "Role is required")
    private User.Role role;

    // Company ID is only required for CUSTOMER role
    private Long companyId;
}
