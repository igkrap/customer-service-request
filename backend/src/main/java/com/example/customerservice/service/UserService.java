package com.example.customerservice.service;

import com.example.customerservice.dto.UserDTO;
import com.example.customerservice.mapper.CompanyMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.Company;
import com.example.customerservice.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CompanyMapper companyMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    public List<UserDTO> getAllUsers() {
        return userMapper.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToDTO(user);
    }

    public List<UserDTO> getAllManagers() {
        return userMapper.findAllManagers().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO updateUserRole(Long id, User.Role role, Long companyId) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setRole(role);

        // Handle company assignment based on role
        if (role == User.Role.ROLE_CUSTOMER) {
            if (companyId == null) {
                throw new RuntimeException("Company ID is required for CUSTOMER role");
            }
            if (!companyMapper.existsById(companyId)) {
                throw new RuntimeException("Company not found with id: " + companyId);
            }
            user.setCompanyId(companyId);
        } else {
            // For MANAGER and ADMIN, clear company assignment
            user.setCompanyId(null);
        }

        user.setUpdatedAt(LocalDateTime.now());

        userMapper.update(user);
        return convertToDTO(user);
    }

    public UserDTO updateUserEmail(Long id, String email) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Check if email is already taken by another user
        if (userMapper.existsByEmail(email)) {
            User existingUser = userMapper.findByEmail(email).orElse(null);
            if (existingUser != null && !existingUser.getId().equals(id)) {
                throw new RuntimeException("Email already in use");
            }
        }

        user.setEmail(email);
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.update(user);
        return convertToDTO(user);
    }

    public UserDTO updateUserPassword(Long id, String password) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setPassword(passwordEncoder.encode(password));
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.updatePassword(user);
        return convertToDTO(user);
    }

    public UserDTO updateUserProfilePicture(Long id, Long profilePictureId) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setProfilePictureId(profilePictureId);
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.update(user);
        return convertToDTO(user);
    }

    public void deleteUser(Long id) {
        if (!userMapper.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userMapper.deleteById(id);
    }

    public List<UserDTO> getPendingUsers() {
        return userMapper.findByApprovalStatus("PENDING").stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO approveUser(Long id, User.Role role, Long companyId) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Set role
        user.setRole(role);

        // Validate and set company only for CUSTOMER role
        if (role == User.Role.ROLE_CUSTOMER) {
            if (companyId == null) {
                throw new RuntimeException("Company ID is required for CUSTOMER role");
            }
            if (!companyMapper.existsById(companyId)) {
                throw new RuntimeException("Company not found with id: " + companyId);
            }
            user.setCompanyId(companyId);
        } else {
            // For MANAGER and ADMIN, company is not required
            user.setCompanyId(null);
        }

        user.setApprovalStatus(User.ApprovalStatus.APPROVED);
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.update(user);

        // Send email notification to user
        if (user.getEmail() != null) {
            emailService.sendUserApprovedEmail(user.getEmail(), user.getUsername());
        }

        return convertToDTO(user);
    }

    public UserDTO rejectUser(Long id) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setApprovalStatus(User.ApprovalStatus.REJECTED);
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.update(user);

        // Send email notification to user
        if (user.getEmail() != null) {
            emailService.sendUserRejectedEmail(user.getEmail(), user.getUsername());
        }

        return convertToDTO(user);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCompanyId(user.getCompanyId());
        dto.setApprovalStatus(user.getApprovalStatus());

        // Load company information if user has a company
        if (user.getCompanyId() != null) {
            companyMapper.findById(user.getCompanyId()).ifPresent(company -> {
                dto.setCompanyName(company.getCompanyName());
                dto.setCompanyCode(company.getCompanyCode());
            });
        }

        // Set profile picture URL if exists
        if (user.getProfilePictureId() != null) {
            dto.setProfilePictureUrl("http://localhost:8080/api/users/profile-picture/" + user.getProfilePictureId());
        }

        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    // User-Project mapping methods
    public void assignProjectsToUser(Long userId, List<Long> projectIds) {
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Remove all existing project assignments
        userMapper.removeAllProjectsFromUser(userId);

        // Assign new projects
        for (Long projectId : projectIds) {
            userMapper.assignProjectToUser(userId, projectId, LocalDateTime.now());
        }
    }

    public List<Long> getProjectIdsByUserId(Long userId) {
        return userMapper.getProjectIdsByUserId(userId);
    }

    public List<Long> getUserIdsByProjectId(Long projectId) {
        return userMapper.getUserIdsByProjectId(projectId);
    }
}
