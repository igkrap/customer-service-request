package com.example.customerservice.service;

import com.example.customerservice.dto.UserDTO;
import com.example.customerservice.mapper.UserMapper;
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
    private PasswordEncoder passwordEncoder;

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

    public List<UserDTO> getCustomersByManagerId(Long managerId) {
        return userMapper.findCustomersByManagerId(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO assignManager(Long customerId, Long managerId) {
        User customer = userMapper.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

        if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
            throw new RuntimeException("User is not a customer");
        }

        if (managerId != null) {
            User manager = userMapper.findById(managerId)
                    .orElseThrow(() -> new RuntimeException("Manager not found with id: " + managerId));

            if (manager.getRole() != User.Role.ROLE_MANAGER) {
                throw new RuntimeException("Assigned user is not a manager");
            }
        }

        userMapper.updateAssignedManager(customerId, managerId, LocalDateTime.now());
        customer.setAssignedManagerId(managerId);
        customer.setUpdatedAt(LocalDateTime.now());

        return convertToDTO(customer);
    }

    public UserDTO updateUserRole(Long id, User.Role role) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setRole(role);
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

    public void deleteUser(Long id) {
        if (!userMapper.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userMapper.deleteById(id);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAssignedManagerId(user.getAssignedManagerId());

        // Load manager name if assigned
        if (user.getAssignedManagerId() != null) {
            User manager = userMapper.findById(user.getAssignedManagerId()).orElse(null);
            if (manager != null) {
                dto.setAssignedManagerName(manager.getUsername());
            }
        }

        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
