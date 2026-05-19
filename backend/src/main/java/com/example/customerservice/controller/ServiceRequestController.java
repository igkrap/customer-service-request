package com.example.customerservice.controller;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.dto.ServiceRequestActionRequest;
import com.example.customerservice.dto.UpdateServiceRequestStatusRequest;
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
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService serviceRequestService;

    @Autowired
    private UserMapper userMapper;


    @GetMapping
    public ResponseEntity<List<ServiceRequestDTO>> getAllServiceRequests(Authentication authentication) {
        String userId = authentication.getName();
        User user = userMapper.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ServiceRequestDTO> requests;
        if (isAdmin(authentication)) {
            // Admin can see all requests
            requests = serviceRequestService.getAllServiceRequests();
        } else if (user.getRole() == User.Role.ROLE_MANAGER) {
            // Managers can see requests assigned to them OR related to their projects
            requests = serviceRequestService.getServiceRequestsByManagerIdOrProjectAccess(user.getId());
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

    @GetMapping("/{parentId}/follow-ups")
    public ResponseEntity<List<ServiceRequestDTO>> getFollowUpRequests(@PathVariable Long parentId) {
        List<ServiceRequestDTO> followUps = serviceRequestService.getFollowUpRequests(parentId);
        return ResponseEntity.ok(followUps);
    }

    @GetMapping("/{id}/histories")
    public ResponseEntity<?> getServiceRequestHistories(@PathVariable Long id) {
        return ResponseEntity.ok(serviceRequestService.getServiceRequestHistories(id));
    }

    @PostMapping
    public ResponseEntity<?> createServiceRequest(@Valid @RequestBody ServiceRequestDTO dto, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User user = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Only customers and admins can create service requests
            if (user.getRole() != User.Role.ROLE_CUSTOMER && user.getRole() != User.Role.ROLE_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only customers and admins can create service requests");
            }

            // For customers, use their own ID and force status to OPEN
            if (user.getRole() == User.Role.ROLE_CUSTOMER) {
                dto.setCustomerId(user.getId());
                dto.setStatus(ServiceRequest.RequestStatus.OPEN);
            }
            // For admins, validate that customerId is provided
            else if (user.getRole() == User.Role.ROLE_ADMIN) {
                if (dto.getCustomerId() == null) {
                    return ResponseEntity.badRequest().body("Customer ID is required");
                }
                // Admins can set initial status, default to OPEN if not provided
                if (dto.getStatus() == null) {
                    dto.setStatus(ServiceRequest.RequestStatus.OPEN);
                }
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
            String userId = authentication.getName();
            User user = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Only customers can fully update service requests
            if (user.getRole() != User.Role.ROLE_CUSTOMER && !isAdmin(authentication)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only customers can update service requests. Managers should use the status update endpoint.");
            }

            // Check if customer is updating their own request
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (user.getRole() == User.Role.ROLE_CUSTOMER &&
                !existingRequest.getCustomerId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only update your own requests");
            }

            if (user.getRole() == User.Role.ROLE_CUSTOMER) {
                dto.setStatus(existingRequest.getStatus());
                dto.setManagerId(existingRequest.getManagerId());
                dto.setHoursSpent(existingRequest.getHoursSpent());
                dto.setResolutionNotes(existingRequest.getResolutionNotes());
                dto.setReceivedAt(existingRequest.getReceivedAt());
                dto.setResolvedAt(existingRequest.getResolvedAt());
            }

            ServiceRequestDTO updatedRequest = serviceRequestService.updateServiceRequest(id, dto, user.getId());
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteServiceRequest(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User user = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user has permission to delete
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) &&
                (user.getRole() != User.Role.ROLE_CUSTOMER || !existingRequest.getCustomerId().equals(user.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own requests");
            }

            serviceRequestService.deleteServiceRequest(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateServiceRequestStatus(@PathVariable Long id,
                                                          @Valid @RequestBody UpdateServiceRequestStatusRequest request,
                                                          Authentication authentication) {
        try {
            String userId = authentication.getName();
            User user = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Only managers and admins can update status
            if (user.getRole() != User.Role.ROLE_MANAGER && !isAdmin(authentication)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only managers and admins can update service request status");
            }

            // Managers can only set status to IN_PROGRESS, RESOLVED, or HOLD
            if (user.getRole() == User.Role.ROLE_MANAGER) {
                if (request.getStatus() != ServiceRequest.RequestStatus.IN_PROGRESS &&
                    request.getStatus() != ServiceRequest.RequestStatus.RESOLVED &&
                    request.getStatus() != ServiceRequest.RequestStatus.HOLD) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Managers can only set status to IN_PROGRESS, RESOLVED, or HOLD");
                }

                ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);

                // For IN_PROGRESS, allow manager to take the request if it's not assigned or assigned to them
                if (request.getStatus() == ServiceRequest.RequestStatus.IN_PROGRESS) {
                    // Service layer will handle the logic and throw exception if another manager already handling
                    ServiceRequestDTO updatedRequest = serviceRequestService.updateServiceRequestStatus(
                        id, request.getStatus(), user.getId(), user.getId());
                    return ResponseEntity.ok(updatedRequest);
                }

                // For other statuses (RESOLVED, HOLD), verify that the manager is assigned to this request
                if (existingRequest.getManagerId() == null ||
                    !existingRequest.getManagerId().equals(user.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("You can only update status of requests assigned to you");
                }
            }

            ServiceRequestDTO updatedRequest = serviceRequestService.updateServiceRequestStatus(
                    id, request.getStatus(), request.getHoursSpent(), request.getResolutionNotes(),
                    request.getAttachments(), user.getId());
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/unassign")
    public ResponseEntity<?> unassignServiceRequest(@PathVariable Long id, Authentication authentication) {
        try {
            String userId = authentication.getName();
            User user = userMapper.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Only managers and admins can unassign
            if (user.getRole() != User.Role.ROLE_MANAGER && !isAdmin(authentication)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only managers and admins can unassign service requests");
            }

            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);

            // Managers can only unassign requests assigned to them
            if (user.getRole() == User.Role.ROLE_MANAGER) {
                if (existingRequest.getManagerId() == null ||
                    !existingRequest.getManagerId().equals(user.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("You can only unassign requests assigned to you");
                }
            }

            ServiceRequestDTO updatedRequest = serviceRequestService.unassignServiceRequest(id, user.getId());
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/triage")
    public ResponseEntity<?> triageServiceRequest(@PathVariable Long id,
                                                  @RequestBody(required = false) ServiceRequestActionRequest request,
                                                  Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) && !canManagerAccessRequest(user, existingRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or project managers can triage this request");
            }
            return ResponseEntity.ok(serviceRequestService.triageServiceRequest(id, getNote(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignServiceRequest(@PathVariable Long id,
                                                  @RequestBody(required = false) ServiceRequestActionRequest request,
                                                  Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            Long managerId = request != null ? request.getManagerId() : null;

            if (isAdmin(authentication)) {
                if (managerId == null) {
                    return ResponseEntity.badRequest().body("Manager ID is required");
                }
            } else if (canManagerAccessRequest(user, existingRequest)) {
                managerId = user.getId();
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or project managers can assign this request");
            }

            return ResponseEntity.ok(serviceRequestService.assignServiceRequest(id, managerId, getNote(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/start")
    public ResponseEntity<?> startServiceRequest(@PathVariable Long id,
                                                 @RequestBody(required = false) ServiceRequestActionRequest request,
                                                 Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            Long managerId = request != null ? request.getManagerId() : null;

            if (isAdmin(authentication)) {
                managerId = managerId != null ? managerId : existingRequest.getManagerId();
            } else if (canManagerAccessRequest(user, existingRequest)) {
                managerId = user.getId();
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or project managers can start this request");
            }

            return ResponseEntity.ok(serviceRequestService.startServiceRequest(id, managerId, getNote(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/hold")
    public ResponseEntity<?> holdServiceRequest(@PathVariable Long id,
                                                @RequestBody(required = false) ServiceRequestActionRequest request,
                                                Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) && !isAssignedManager(user, existingRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or assigned managers can hold this request");
            }
            return ResponseEntity.ok(serviceRequestService.holdServiceRequest(id, getNote(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/wait-customer")
    public ResponseEntity<?> waitCustomerServiceRequest(@PathVariable Long id,
                                                        @RequestBody(required = false) ServiceRequestActionRequest request,
                                                        Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) && !isAssignedManager(user, existingRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or assigned managers can request customer response");
            }
            return ResponseEntity.ok(serviceRequestService.waitCustomerServiceRequest(id, getNote(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<?> resolveServiceRequest(@PathVariable Long id,
                                                   @RequestBody ServiceRequestActionRequest request,
                                                   Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) && !isAssignedManager(user, existingRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or assigned managers can resolve this request");
            }
            return ResponseEntity.ok(serviceRequestService.resolveServiceRequest(
                    id,
                    request != null ? request.getHoursSpent() : null,
                    request != null ? request.getResolutionNotes() : null,
                    request != null ? request.getAttachments() : null,
                    getNote(request),
                    user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<?> closeServiceRequest(@PathVariable Long id,
                                                 @RequestBody(required = false) ServiceRequestActionRequest request,
                                                 Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) && !isCustomerOwner(user, existingRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or owning customers can close this request");
            }
            return ResponseEntity.ok(serviceRequestService.closeServiceRequest(id, getNote(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject-resolution")
    public ResponseEntity<?> rejectResolution(@PathVariable Long id,
                                              @RequestBody(required = false) ServiceRequestActionRequest request,
                                              Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ServiceRequest existingRequest = serviceRequestService.getServiceRequestEntityById(id);
            if (!isAdmin(authentication) && !isCustomerOwner(user, existingRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins or owning customers can reject this resolution");
            }
            return ResponseEntity.ok(serviceRequestService.rejectResolution(id, getReason(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelServiceRequest(@PathVariable Long id,
                                                  @RequestBody(required = false) ServiceRequestActionRequest request,
                                                  Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            if (!isAdmin(authentication)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can cancel service requests");
            }
            return ResponseEntity.ok(serviceRequestService.cancelServiceRequest(id, getReason(request), user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String userId = authentication.getName();
        return userMapper.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAssignedManager(User user, ServiceRequest request) {
        return user.getRole() == User.Role.ROLE_MANAGER &&
                request.getManagerId() != null &&
                request.getManagerId().equals(user.getId());
    }

    private boolean canManagerAccessRequest(User user, ServiceRequest request) {
        if (user.getRole() != User.Role.ROLE_MANAGER) {
            return false;
        }
        if (isAssignedManager(user, request)) {
            return true;
        }
        if (request.getManagerId() != null && !request.getManagerId().equals(user.getId())) {
            return false;
        }
        return request.getProjectId() != null &&
                userMapper.getProjectIdsByUserId(user.getId()).contains(request.getProjectId());
    }

    private boolean isCustomerOwner(User user, ServiceRequest request) {
        return user.getRole() == User.Role.ROLE_CUSTOMER &&
                request.getCustomerId() != null &&
                request.getCustomerId().equals(user.getId());
    }

    private String getNote(ServiceRequestActionRequest request) {
        if (request == null) {
            return null;
        }
        return request.getNote() != null ? request.getNote() : request.getReason();
    }

    private String getReason(ServiceRequestActionRequest request) {
        if (request == null) {
            return null;
        }
        return request.getReason() != null ? request.getReason() : request.getNote();
    }

    private ServiceRequestDTO convertToDTO(ServiceRequest request) {
        ServiceRequestDTO dto = new ServiceRequestDTO();
        dto.setId(request.getId());
        dto.setTitle(request.getTitle());
        dto.setDescription(request.getDescription());
        dto.setStatus(request.getStatus());
        dto.setPriority(request.getPriority());
        dto.setCustomerId(request.getCustomerId());
        dto.setManagerId(request.getManagerId());
        dto.setProjectId(request.getProjectId());
        dto.setCreatedByUserId(request.getCreatedByUserId());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        dto.setResolvedAt(request.getResolvedAt());
        dto.setDueDate(request.getDueDate());
        return dto;
    }
}
