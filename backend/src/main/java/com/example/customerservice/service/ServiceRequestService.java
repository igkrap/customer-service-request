package com.example.customerservice.service;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.mapper.ProjectMapper;
import com.example.customerservice.mapper.ServiceRequestMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.Project;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServiceRequestService {

    @Autowired
    private ServiceRequestMapper serviceRequestMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private EmailService emailService;

    public List<ServiceRequestDTO> getAllServiceRequests() {
        return serviceRequestMapper.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ServiceRequestDTO getServiceRequestById(Long id) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));
        return convertToDTO(serviceRequest);
    }

    public List<ServiceRequestDTO> getServiceRequestsByCustomerId(Long customerId) {
        return serviceRequestMapper.findByCustomerId(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getServiceRequestsByManagerId(Long managerId) {
        return serviceRequestMapper.findByManagerId(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getServiceRequestsByManagerIdOrProjectAccess(Long managerId) {
        return serviceRequestMapper.findByManagerIdOrProjectAccess(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getServiceRequestsByStatus(ServiceRequest.RequestStatus status) {
        return serviceRequestMapper.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getServiceRequestsByPriority(ServiceRequest.Priority priority) {
        return serviceRequestMapper.findByPriority(priority).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getServiceRequestsByCreatedByUserId(Long userId) {
        return serviceRequestMapper.findByCreatedByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getFollowUpRequests(Long parentId) {
        return serviceRequestMapper.findByParentId(parentId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ServiceRequest getServiceRequestEntityById(Long id) {
        return serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));
    }

    public ServiceRequestDTO createServiceRequest(ServiceRequestDTO dto, Long userId) {
        User customer = userMapper.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));

        if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
            throw new RuntimeException("User is not a customer");
        }

        // Validate manager if provided
        if (dto.getManagerId() != null) {
            User manager = userMapper.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found with id: " + dto.getManagerId()));

            if (manager.getRole() != User.Role.ROLE_MANAGER) {
                throw new RuntimeException("Assigned user is not a manager");
            }
        }

        ServiceRequest serviceRequest = convertToEntity(dto);
        serviceRequest.setCustomerId(customer.getId());
        serviceRequest.setCreatedByUserId(userId);
        serviceRequest.setCreatedAt(LocalDateTime.now());
        serviceRequest.setUpdatedAt(LocalDateTime.now());

        // Set default values if not provided
        if (serviceRequest.getStatus() == null) {
            serviceRequest.setStatus(ServiceRequest.RequestStatus.OPEN);
        }
        if (serviceRequest.getPriority() == null) {
            serviceRequest.setPriority(ServiceRequest.Priority.MEDIUM);
        }

        serviceRequestMapper.insert(serviceRequest);

        // Link attachments if provided
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            for (com.example.customerservice.dto.AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getId() != null) {
                    attachmentService.linkToServiceRequest(serviceRequest.getId(), attachmentDTO.getId());
                }
            }
        }

        // Send email notification to manager if assigned
        if (dto.getManagerId() != null) {
            User manager = userMapper.findById(dto.getManagerId()).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendServiceRequestCreatedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
        }

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO createServiceRequest(ServiceRequestDTO dto) {
        User customer = userMapper.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));

        if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
            throw new RuntimeException("User is not a customer");
        }

        // Validate manager if provided
        if (dto.getManagerId() != null) {
            User manager = userMapper.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found with id: " + dto.getManagerId()));

            if (manager.getRole() != User.Role.ROLE_MANAGER) {
                throw new RuntimeException("Assigned user is not a manager");
            }
        }

        ServiceRequest serviceRequest = convertToEntity(dto);
        serviceRequest.setCustomerId(customer.getId());
        serviceRequest.setCreatedAt(LocalDateTime.now());
        serviceRequest.setUpdatedAt(LocalDateTime.now());

        // Set default values if not provided
        if (serviceRequest.getStatus() == null) {
            serviceRequest.setStatus(ServiceRequest.RequestStatus.OPEN);
        }
        if (serviceRequest.getPriority() == null) {
            serviceRequest.setPriority(ServiceRequest.Priority.MEDIUM);
        }

        serviceRequestMapper.insert(serviceRequest);

        // Link attachments if provided
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            for (com.example.customerservice.dto.AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getId() != null) {
                    attachmentService.linkToServiceRequest(serviceRequest.getId(), attachmentDTO.getId());
                }
            }
        }

        // Send email notification to manager if assigned
        if (dto.getManagerId() != null) {
            User manager = userMapper.findById(dto.getManagerId()).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendServiceRequestCreatedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
        }

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO updateServiceRequest(Long id, ServiceRequestDTO dto) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        Long oldManagerId = serviceRequest.getManagerId();

        serviceRequest.setTitle(dto.getTitle());
        serviceRequest.setDescription(dto.getDescription());
        serviceRequest.setStatus(dto.getStatus());
        serviceRequest.setPriority(dto.getPriority());
        serviceRequest.setManagerId(dto.getManagerId());
        serviceRequest.setProjectId(dto.getProjectId());
        serviceRequest.setDueDate(dto.getDueDate());
        serviceRequest.setUpdatedAt(LocalDateTime.now());

        // Set resolvedAt when status changes to RESOLVED
        if (dto.getStatus() == ServiceRequest.RequestStatus.RESOLVED &&
            oldStatus != ServiceRequest.RequestStatus.RESOLVED) {
            if (serviceRequest.getResolvedAt() == null) {
                serviceRequest.setResolvedAt(LocalDateTime.now());
            }
        }

        // Validate customer if changed
        if (dto.getCustomerId() != null && !serviceRequest.getCustomerId().equals(dto.getCustomerId())) {
            User customer = userMapper.findById(dto.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));

            if (customer.getRole() != User.Role.ROLE_CUSTOMER) {
                throw new RuntimeException("User is not a customer");
            }
            serviceRequest.setCustomerId(customer.getId());
        }

        // Validate manager if changed
        if (dto.getManagerId() != null) {
            User manager = userMapper.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found with id: " + dto.getManagerId()));

            if (manager.getRole() != User.Role.ROLE_MANAGER) {
                throw new RuntimeException("Assigned user is not a manager");
            }
        }

        // Validate project if changed
        if (dto.getProjectId() != null) {
            projectMapper.findById(dto.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + dto.getProjectId()));
        }

        serviceRequestMapper.update(serviceRequest);

        // Update attachments if provided
        if (dto.getAttachments() != null) {
            List<com.example.customerservice.dto.AttachmentDTO> existingAttachments =
                attachmentService.getAttachmentsByServiceRequestId(id);

            Set<Long> incomingAttachmentIds = dto.getAttachments().stream()
                .filter(a -> a.getId() != null)
                .map(com.example.customerservice.dto.AttachmentDTO::getId)
                .collect(Collectors.toCollection(HashSet::new));

            List<com.example.customerservice.dto.AttachmentDTO> existingRequestAttachments = existingAttachments.stream()
                .filter(a -> a.getAttachmentType() == null || "REQUEST".equalsIgnoreCase(a.getAttachmentType()))
                .collect(Collectors.toList());

            for (com.example.customerservice.dto.AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getId() != null) {
                    boolean alreadyLinked = existingRequestAttachments.stream()
                        .anyMatch(a -> a.getId().equals(attachmentDTO.getId()));

                    if (!alreadyLinked) {
                        attachmentService.linkToServiceRequest(id, attachmentDTO.getId());
                    }
                }
            }

            for (com.example.customerservice.dto.AttachmentDTO existing : existingRequestAttachments) {
                if (!incomingAttachmentIds.contains(existing.getId())) {
                    attachmentService.unlinkFromServiceRequest(id, existing.getId());
                }
            }
        }

        // Send email notifications
        // 1. If manager changed, notify new manager
        if (dto.getManagerId() != null && !dto.getManagerId().equals(oldManagerId)) {
            User manager = userMapper.findById(dto.getManagerId()).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendManagerAssignedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
        }

        // 2. If status changed, notify customer
        if (dto.getStatus() != oldStatus) {
            User customer = userMapper.findById(serviceRequest.getCustomerId()).orElse(null);
            if (customer != null && customer.getEmail() != null) {
                if (dto.getStatus() == ServiceRequest.RequestStatus.RESOLVED) {
                    emailService.sendServiceRequestResolvedEmail(customer.getEmail(), serviceRequest.getTitle(), serviceRequest.getResolutionNotes());
                } else {
                    emailService.sendServiceRequestStatusChangedEmail(customer.getEmail(), serviceRequest.getTitle(),
                        oldStatus != null ? oldStatus.name() : "UNKNOWN", dto.getStatus().name());
                }
            }
        }

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status) {
        return updateServiceRequestStatus(id, status, null, null, null);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status,
                                                        Double hoursSpent, String resolutionNotes) {
        return updateServiceRequestStatus(id, status, hoursSpent, resolutionNotes, null);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status,
                                                        Double hoursSpent, String resolutionNotes,
                                                        List<com.example.customerservice.dto.AttachmentDTO> attachments) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        serviceRequest.setStatus(status);
        serviceRequest.setUpdatedAt(LocalDateTime.now());

        // Set resolvedAt when status changes to RESOLVED
        if (status == ServiceRequest.RequestStatus.RESOLVED &&
            oldStatus != ServiceRequest.RequestStatus.RESOLVED) {
            if (serviceRequest.getResolvedAt() == null) {
                serviceRequest.setResolvedAt(LocalDateTime.now());
            }
        }

        // Update hoursSpent and resolutionNotes if provided
        if (hoursSpent != null) {
            serviceRequest.setHoursSpent(hoursSpent);
        }
        if (resolutionNotes != null) {
            serviceRequest.setResolutionNotes(resolutionNotes);
        }

        serviceRequestMapper.update(serviceRequest);

        // Link resolution attachments if provided
        if (attachments != null) {
            List<com.example.customerservice.dto.AttachmentDTO> existingAttachments =
                attachmentService.getAttachmentsByServiceRequestId(id);

            Set<Long> incomingAttachmentIds = attachments.stream()
                .filter(a -> a.getId() != null)
                .map(com.example.customerservice.dto.AttachmentDTO::getId)
                .collect(Collectors.toCollection(HashSet::new));

            List<com.example.customerservice.dto.AttachmentDTO> existingResolutionAttachments = existingAttachments.stream()
                .filter(a -> "RESOLUTION".equalsIgnoreCase(a.getAttachmentType()))
                .collect(Collectors.toList());

            for (com.example.customerservice.dto.AttachmentDTO attachmentDTO : attachments) {
                if (attachmentDTO.getId() != null) {
                    boolean alreadyLinked = existingResolutionAttachments.stream()
                        .anyMatch(a -> a.getId().equals(attachmentDTO.getId()));

                    if (!alreadyLinked) {
                        attachmentService.linkToServiceRequest(id, attachmentDTO.getId(), "RESOLUTION");
                    }
                }
            }

            for (com.example.customerservice.dto.AttachmentDTO existing : existingResolutionAttachments) {
                if (!incomingAttachmentIds.contains(existing.getId())) {
                    attachmentService.unlinkFromServiceRequest(id, existing.getId());
                }
            }
        }

        // Send email notification to customer if status changed
        if (status != oldStatus) {
            User customer = userMapper.findById(serviceRequest.getCustomerId()).orElse(null);
            if (customer != null && customer.getEmail() != null) {
                if (status == ServiceRequest.RequestStatus.RESOLVED) {
                    emailService.sendServiceRequestResolvedEmail(customer.getEmail(), serviceRequest.getTitle(), serviceRequest.getResolutionNotes());
                } else {
                    emailService.sendServiceRequestStatusChangedEmail(customer.getEmail(), serviceRequest.getTitle(),
                        oldStatus != null ? oldStatus.name() : "UNKNOWN", status.name());
                }
            }
        }

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status, Long managerId) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        // Check if already IN_PROGRESS and prevent other managers from taking over
        if (status == ServiceRequest.RequestStatus.IN_PROGRESS) {
            if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.IN_PROGRESS) {
                // Already in progress
                if (serviceRequest.getManagerId() != null && !serviceRequest.getManagerId().equals(managerId)) {
                    throw new RuntimeException("This request is already being handled by another manager");
                }
            }
            // Assign manager when moving to IN_PROGRESS
            serviceRequest.setManagerId(managerId);
        }

        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        serviceRequest.setStatus(status);
        serviceRequest.setUpdatedAt(LocalDateTime.now());

        // Set resolvedAt when status changes to RESOLVED
        if (status == ServiceRequest.RequestStatus.RESOLVED &&
            oldStatus != ServiceRequest.RequestStatus.RESOLVED) {
            if (serviceRequest.getResolvedAt() == null) {
                serviceRequest.setResolvedAt(LocalDateTime.now());
            }
        }

        serviceRequestMapper.update(serviceRequest);

        // Send email notifications
        // 1. If manager assigned, notify manager
        if (status == ServiceRequest.RequestStatus.IN_PROGRESS && oldStatus != ServiceRequest.RequestStatus.IN_PROGRESS && managerId != null) {
            User manager = userMapper.findById(managerId).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendManagerAssignedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
        }

        // 2. If status changed, notify customer
        if (status != oldStatus) {
            User customer = userMapper.findById(serviceRequest.getCustomerId()).orElse(null);
            if (customer != null && customer.getEmail() != null) {
                if (status == ServiceRequest.RequestStatus.RESOLVED) {
                    emailService.sendServiceRequestResolvedEmail(customer.getEmail(), serviceRequest.getTitle(), serviceRequest.getResolutionNotes());
                } else {
                    emailService.sendServiceRequestStatusChangedEmail(customer.getEmail(), serviceRequest.getTitle(),
                        oldStatus != null ? oldStatus.name() : "UNKNOWN", status.name());
                }
            }
        }

        return convertToDTO(serviceRequest);
    }

    public void deleteServiceRequest(Long id) {
        if (!serviceRequestMapper.existsById(id)) {
            throw new RuntimeException("Service request not found with id: " + id);
        }
        serviceRequestMapper.deleteById(id);
    }

    private ServiceRequestDTO convertToDTO(ServiceRequest serviceRequest) {
        ServiceRequestDTO dto = new ServiceRequestDTO();
        dto.setId(serviceRequest.getId());
        dto.setTitle(serviceRequest.getTitle());
        dto.setDescription(serviceRequest.getDescription());
        dto.setStatus(serviceRequest.getStatus());
        dto.setPriority(serviceRequest.getPriority());
        dto.setCustomerId(serviceRequest.getCustomerId());
        dto.setManagerId(serviceRequest.getManagerId());

        // Load customer details for DTO
        User customer = userMapper.findById(serviceRequest.getCustomerId())
                .orElse(null);
        if (customer != null) {
            dto.setCustomerName(customer.getUsername());
        }

        // Load manager details for DTO
        if (serviceRequest.getManagerId() != null) {
            User manager = userMapper.findById(serviceRequest.getManagerId())
                    .orElse(null);
            if (manager != null) {
                dto.setManagerName(manager.getUsername());
            }
        }

        // Load project details for DTO
        dto.setProjectId(serviceRequest.getProjectId());
        if (serviceRequest.getProjectId() != null) {
            Project project = projectMapper.findById(serviceRequest.getProjectId())
                    .orElse(null);
            if (project != null) {
                dto.setProjectName(project.getProjectName());
            }
        }

        dto.setCreatedByUserId(serviceRequest.getCreatedByUserId());
        dto.setParentId(serviceRequest.getParentId());
        dto.setCreatedAt(serviceRequest.getCreatedAt());
        dto.setUpdatedAt(serviceRequest.getUpdatedAt());
        dto.setResolvedAt(serviceRequest.getResolvedAt());
        dto.setHoursSpent(serviceRequest.getHoursSpent());
        dto.setResolutionNotes(serviceRequest.getResolutionNotes());
        dto.setDueDate(serviceRequest.getDueDate());

        // Note: Attachments, comments, and follow-ups are loaded separately via dedicated API endpoints
        // to avoid N+1 query issues and recursive loading problems.
        // Frontend should call:
        // - GET /api/attachments/service-request/{id}
        // - GET /api/service-request-comments/service-request/{id}
        // - GET /api/service-requests/{id}/follow-ups

        return dto;
    }

    private ServiceRequest convertToEntity(ServiceRequestDTO dto) {
        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setTitle(dto.getTitle());
        serviceRequest.setDescription(dto.getDescription());
        serviceRequest.setStatus(dto.getStatus());
        serviceRequest.setPriority(dto.getPriority());
        serviceRequest.setManagerId(dto.getManagerId());
        serviceRequest.setProjectId(dto.getProjectId());
        serviceRequest.setParentId(dto.getParentId());
        serviceRequest.setHoursSpent(dto.getHoursSpent());
        serviceRequest.setResolutionNotes(dto.getResolutionNotes());
        serviceRequest.setDueDate(dto.getDueDate());
        return serviceRequest;
    }
}
