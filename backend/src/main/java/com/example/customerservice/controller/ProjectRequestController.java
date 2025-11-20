package com.example.customerservice.controller;

import com.example.customerservice.dto.ProjectRequestDTO;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.User;
import com.example.customerservice.service.ProjectRequestService;
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
@RequestMapping("/api/project-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class ProjectRequestController {

    @Autowired
    private ProjectRequestService projectRequestService;

    @Autowired
    private UserMapper userMapper;

    // ADMIN can view all project requests, CUSTOMER can view their own
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    @GetMapping
    public ResponseEntity<List<ProjectRequestDTO>> getAllProjectRequests(Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<ProjectRequestDTO> requests;
            if (currentUser.getRole() == User.Role.ROLE_ADMIN) {
                // Admin can see all requests
                requests = projectRequestService.getAllProjectRequests();
            } else {
                // Customer can only see their own requests
                requests = projectRequestService.getProjectRequestsByUserId(currentUser.getId());
            }

            return ResponseEntity.ok(requests);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ADMIN and CUSTOMER can view project request details
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    @GetMapping("/{id}")
    public ResponseEntity<ProjectRequestDTO> getProjectRequestById(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ProjectRequestDTO request = projectRequestService.getProjectRequestById(id);

            // Customer can only view their own requests
            if (currentUser.getRole() == User.Role.ROLE_CUSTOMER &&
                !request.getRequestedByUserId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            return ResponseEntity.ok(request);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Only CUSTOMER can create project requests
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    public ResponseEntity<?> createProjectRequest(@Valid @RequestBody ProjectRequestDTO dto, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ProjectRequestDTO createdRequest = projectRequestService.createProjectRequest(dto, currentUser.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // CUSTOMER can update their own pending project requests
    @PreAuthorize("hasRole('CUSTOMER')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProjectRequest(@PathVariable Long id, @Valid @RequestBody ProjectRequestDTO dto,
                                                   Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ProjectRequestDTO existingRequest = projectRequestService.getProjectRequestById(id);

            // Customer can only update their own requests
            if (!existingRequest.getRequestedByUserId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own requests");
            }

            ProjectRequestDTO updatedRequest = projectRequestService.updateProjectRequest(id, dto);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Only ADMIN can approve project requests
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveProjectRequest(@PathVariable Long id, @RequestBody Map<String, String> request,
                                                    Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String approvalNotes = request.get("approvalNotes");
            ProjectRequestDTO approvedRequest = projectRequestService.approveProjectRequest(id, currentUser.getId(), approvalNotes);
            return ResponseEntity.ok(approvedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Only ADMIN can reject project requests
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectProjectRequest(@PathVariable Long id, @RequestBody Map<String, String> request,
                                                   Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String approvalNotes = request.get("approvalNotes");
            ProjectRequestDTO rejectedRequest = projectRequestService.rejectProjectRequest(id, currentUser.getId(), approvalNotes);
            return ResponseEntity.ok(rejectedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // CUSTOMER can delete their own pending/rejected requests
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProjectRequest(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User currentUser = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ProjectRequestDTO request = projectRequestService.getProjectRequestById(id);

            // Customer can only delete their own requests, Admin can delete any
            if (currentUser.getRole() == User.Role.ROLE_CUSTOMER &&
                !request.getRequestedByUserId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            projectRequestService.deleteProjectRequest(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
