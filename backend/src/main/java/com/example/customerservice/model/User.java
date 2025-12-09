package com.example.customerservice.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private Long id;

    @NotBlank(message = "User ID is required")
    @Size(min = 3, max = 50, message = "User ID must be between 3 and 50 characters")
    private String userId;

    @NotBlank(message = "Username is required")
    @Size(min = 1, max = 50, message = "Username must be between 1 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private Role role;

    private Long companyId;

    private ApprovalStatus approvalStatus;

    private Long profilePictureId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum Role {
        ROLE_CUSTOMER, ROLE_MANAGER, ROLE_ADMIN
    }

    public enum ApprovalStatus {
        PENDING,    // 승인 대기
        APPROVED,   // 승인 완료
        REJECTED    // 승인 거절
    }
}
