package com.example.customerservice.controller;

import com.example.customerservice.dto.ApproveUserRequest;
import com.example.customerservice.dto.AssignManagerRequest;
import com.example.customerservice.dto.AssignCustomersRequest;
import com.example.customerservice.dto.UpdateUserEmailRequest;
import com.example.customerservice.dto.UpdateUserPasswordRequest;
import com.example.customerservice.dto.UpdateUserRoleRequest;
import com.example.customerservice.dto.UserDTO;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.User;
import com.example.customerservice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user is admin or requesting their own info
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin && !currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only view your own information");
            }

            UserDTO user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @Valid @RequestBody UpdateUserRoleRequest request) {
        try {
            UserDTO updatedUser = userService.updateUserRole(id, request.getRole(), request.getCompanyId());
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/email")
    public ResponseEntity<?> updateUserEmail(@PathVariable Long id,
                                             @Valid @RequestBody UpdateUserEmailRequest request,
                                             Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user is admin or updating their own email
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin && !currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only update your own email");
            }

            UserDTO updatedUser = userService.updateUserEmail(id, request.getEmail());
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updateUserPassword(@PathVariable Long id,
                                                @Valid @RequestBody UpdateUserPasswordRequest request,
                                                Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user is admin or updating their own password
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin && !currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only update your own password");
            }

            UserDTO updatedUser = userService.updateUserPassword(id, request.getPassword());
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/managers")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<List<UserDTO>> getAllManagers() {
        List<UserDTO> managers = userService.getAllManagers();
        return ResponseEntity.ok(managers);
    }

    @GetMapping("/managers/{managerId}/customers")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserDTO>> getCustomersByManagerId(@PathVariable Long managerId) {
        List<UserDTO> customers = userService.getCustomersByManagerId(managerId);
        return ResponseEntity.ok(customers);
    }

    @PutMapping("/{customerId}/assign-managers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignManagers(@PathVariable Long customerId,
                                            @Valid @RequestBody AssignManagerRequest request) {
        try {
            UserDTO updatedCustomer = userService.assignManagers(customerId, request.getManagerIds());
            return ResponseEntity.ok(updatedCustomer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{customerId}/managers/{managerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addManagerToCustomer(@PathVariable Long customerId,
                                                   @PathVariable Long managerId) {
        try {
            UserDTO updatedCustomer = userService.addManagerToCustomer(customerId, managerId);
            return ResponseEntity.ok(updatedCustomer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{customerId}/managers/{managerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeManagerFromCustomer(@PathVariable Long customerId,
                                                        @PathVariable Long managerId) {
        try {
            UserDTO updatedCustomer = userService.removeManagerFromCustomer(customerId, managerId);
            return ResponseEntity.ok(updatedCustomer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/managers/{managerId}/assign-customers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignCustomersToManager(@PathVariable Long managerId,
                                                       @Valid @RequestBody AssignCustomersRequest request) {
        try {
            UserDTO updatedManager = userService.assignCustomersToManager(managerId, request.getCustomerIds());
            return ResponseEntity.ok(updatedManager);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getPendingUsers() {
        List<UserDTO> pendingUsers = userService.getPendingUsers();
        return ResponseEntity.ok(pendingUsers);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveUser(@PathVariable Long id, @Valid @RequestBody ApproveUserRequest request) {
        try {
            UserDTO approvedUser = userService.approveUser(id, request.getRole(), request.getCompanyId());
            return ResponseEntity.ok(approvedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        try {
            UserDTO rejectedUser = userService.rejectUser(id);
            return ResponseEntity.ok(rejectedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/assign-projects")
    public ResponseEntity<?> assignProjectsToUser(@PathVariable Long id,
                                                    @Valid @RequestBody Map<String, List<Integer>> request,
                                                    Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Admin can assign projects to any user
            // Customer and Manager can only assign projects to themselves
            if (currentUser.getRole() != User.Role.ROLE_ADMIN && !currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only assign projects to yourself");
            }

            // Convert Integer list to Long list
            List<Integer> projectIdsInt = request.get("projectIds");
            List<Long> projectIds = projectIdsInt.stream()
                    .map(Integer::longValue)
                    .collect(java.util.stream.Collectors.toList());

            userService.assignProjectsToUser(id, projectIds);
            return ResponseEntity.ok().body("Projects assigned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/projects")
    public ResponseEntity<List<Long>> getProjectsByUserId(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Admin can view any user's projects
            // Customer and Manager can only view their own projects
            if (currentUser.getRole() != User.Role.ROLE_ADMIN && !currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<Long> projectIds = userService.getProjectIdsByUserId(id);
            return ResponseEntity.ok(projectIds);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
