package com.example.customerservice.controller;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.model.User;
import com.example.customerservice.service.ServiceRequestService;
import com.example.customerservice.mapper.UserMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService serviceRequestService;

    @Autowired
    private UserMapper userMapper;

    @GetMapping
    public ResponseEntity<List<ServiceRequestDTO>> getAllServiceRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ServiceRequestDTO> requests;
        if (isAdmin(authentication)) {
            // Admin can see all requests
            requests = serviceRequestService.getAllServiceRequests();
        } else if (user.getRole() == User.Role.ROLE_MANAGER) {
            // Managers can see requests assigned to them
            requests = serviceRequestService.getServiceRequestsByManagerId(user.getId());
        } else if (user.getRole() == User.Role.ROLE_CUSTOMER) {
            // Customers can only see their own requests
            requests = serviceRequestService.getServiceRequestsByCustomerId(user.getId());
        } else {
            requests = List.of();
        }
        return ResponseEntity.ok(requests);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequestDTO> getServiceRequestById(@PathVariable Long id) {
        try {
            ServiceRequestDTO request = serviceRequestService.getServiceRequestById(id);
            return ResponseEntity.ok(request);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<ServiceRequestDTO>> getServiceRequestsByCustomerId(@PathVariable Long customerId) {
        List<ServiceRequestDTO> requests = serviceRequestService.getServiceRequestsByCustomerId(customerId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<ServiceRequestDTO>> getServiceRequestsByManagerId(@PathVariable Long managerId) {
        List<ServiceRequestDTO> requests = serviceRequestService.getServiceRequestsByManagerId(managerId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ServiceRequestDTO>> getServiceRequestsByStatus(@PathVariable ServiceRequest.RequestStatus status) {
        List<ServiceRequestDTO> requests = serviceRequestService.getServiceRequestsByStatus(status);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<ServiceRequestDTO>> getServiceRequestsByPriority(@PathVariable ServiceRequest.Priority priority) {
        List<ServiceRequestDTO> requests = serviceRequestService.getServiceRequestsByPriority(priority);
        return ResponseEntity.ok(requests);
    }

    @PostMapping
    public ResponseEntity<?> createServiceRequest(@Valid @RequestBody ServiceRequestDTO dto, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userMapper.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // If customer is creating, use their own ID
            if (user.getRole() == User.Role.ROLE_CUSTOMER) {
                dto.setCustomerId(user.getId());
            }

            ServiceRequestDTO createdRequest = serviceRequestService.createServiceRequest(dto, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateServiceRequest(@PathVariable Long id, @Valid @RequestBody ServiceRequestDTO dto, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userMapper.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user has permission to update
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) &&
                user.getRole() == User.Role.ROLE_CUSTOMER &&
                !existingRequest.getCustomerId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own requests");
            }

            ServiceRequestDTO updatedRequest = serviceRequestService.updateServiceRequest(id, dto);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteServiceRequest(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userMapper.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user has permission to delete
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) &&
                user.getRole() == User.Role.ROLE_CUSTOMER &&
                !existingRequest.getCustomerId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own requests");
            }

            serviceRequestService.deleteServiceRequest(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
