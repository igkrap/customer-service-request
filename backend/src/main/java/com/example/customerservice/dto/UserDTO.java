package com.example.customerservice.dto;

import com.example.customerservice.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private String userId;
    private String username;
    private String email;
    private User.Role role;
    private Long companyId;
    private String companyName;
    private String companyCode;
    private User.ApprovalStatus approvalStatus;
    private Long profilePictureId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
