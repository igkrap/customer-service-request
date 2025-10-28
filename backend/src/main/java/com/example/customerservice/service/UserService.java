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

    public UserDTO assignManagers(Long customerId, List<Long> managerIds) {
        User customer = userMapper.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

        if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
            throw new RuntimeException("User is not a customer");
        }

        // Validate all managers exist and have ROLE_MANAGER
        for (Long managerId : managerIds) {
            User manager = userMapper.findById(managerId)
                    .orElseThrow(() -> new RuntimeException("Manager not found with id: " + managerId));

            if (manager.getRole() != User.Role.ROLE_MANAGER) {
                throw new RuntimeException("User with id " + managerId + " is not a manager");
            }
        }

        // Remove all existing manager assignments
        userMapper.removeAllManagersFromCustomer(customerId);

        // Assign new managers
        for (Long managerId : managerIds) {
            userMapper.assignManagerToCustomer(customerId, managerId, LocalDateTime.now());
        }

        return convertToDTO(customer);
    }

    public UserDTO addManagerToCustomer(Long customerId, Long managerId) {
        User customer = userMapper.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

        if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
            throw new RuntimeException("User is not a customer");
        }

        User manager = userMapper.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found with id: " + managerId));

        if (manager.getRole() != User.Role.ROLE_MANAGER) {
            throw new RuntimeException("User is not a manager");
        }

        userMapper.assignManagerToCustomer(customerId, managerId, LocalDateTime.now());
        return convertToDTO(customer);
    }

    public UserDTO removeManagerFromCustomer(Long customerId, Long managerId) {
        User customer = userMapper.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

        if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
            throw new RuntimeException("User is not a customer");
        }

        userMapper.removeManagerFromCustomer(customerId, managerId);
        return convertToDTO(customer);
    }

    public UserDTO assignCustomersToManager(Long managerId, List<Long> customerIds) {
        User manager = userMapper.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found with id: " + managerId));

        if (manager.getRole() != User.Role.ROLE_MANAGER) {
            throw new RuntimeException("User is not a manager");
        }

        // Validate all customers exist and have ROLE_CUSTOMER
        for (Long customerId : customerIds) {
            User customer = userMapper.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

            if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
                throw new RuntimeException("User with id " + customerId + " is not a customer");
            }
        }

        // Remove all existing customer assignments for this manager
        userMapper.removeAllCustomersFromManager(managerId);

        // Assign new customers
        for (Long customerId : customerIds) {
            userMapper.assignManagerToCustomer(customerId, managerId, LocalDateTime.now());
        }

        return convertToDTO(manager);
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
        return convertToDTO(user);
    }

    public UserDTO rejectUser(Long id) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setApprovalStatus(User.ApprovalStatus.REJECTED);
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.update(user);
        return convertToDTO(user);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
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

        // Load managers if user is a customer
        if (user.getRole() == User.Role.ROLE_CUSTOMER) {
            List<Long> managerIds = userMapper.getManagerIdsByCustomerId(user.getId());
            dto.setManagerIds(managerIds);

            List<User> managers = userMapper.getManagersByCustomerId(user.getId());
            List<String> managerNames = managers.stream()
                    .map(User::getUsername)
                    .collect(Collectors.toList());
            dto.setManagerNames(managerNames);
        }

        // Load customers if user is a manager
        if (user.getRole() == User.Role.ROLE_MANAGER) {
            List<Long> customerIds = userMapper.getCustomerIdsByManagerId(user.getId());
            dto.setCustomerIds(customerIds);

            List<User> customers = userMapper.findCustomersByManagerId(user.getId());
            List<String> customerNames = customers.stream()
                    .map(User::getUsername)
                    .collect(Collectors.toList());
            dto.setCustomerNames(customerNames);
        }

        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
