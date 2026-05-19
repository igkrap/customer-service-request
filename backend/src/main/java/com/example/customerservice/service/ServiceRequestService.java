package com.example.customerservice.service;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.mapper.CompanyMapper;
import com.example.customerservice.mapper.ProjectMapper;
import com.example.customerservice.mapper.ServiceRequestHistoryMapper;
import com.example.customerservice.mapper.ServiceRequestMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.Project;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.model.ServiceRequestHistory;
import com.example.customerservice.model.User;
import com.example.customerservice.dto.ServiceRequestHistoryDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private ServiceRequestHistoryMapper serviceRequestHistoryMapper;

    @Autowired
    private CompanyMapper companyMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

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

    public List<ServiceRequestHistoryDTO> getServiceRequestHistories(Long serviceRequestId) {
        return serviceRequestHistoryMapper.findByServiceRequestId(serviceRequestId).stream()
                .map(this::convertToHistoryDTO)
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
        if (serviceRequest.getReceivedAt() == null || serviceRequest.getReceivedAt().isBlank()) {
            serviceRequest.setReceivedAt(getTodayDateString());
        }

        // Set default values if not provided
        if (serviceRequest.getStatus() == null) {
            serviceRequest.setStatus(ServiceRequest.RequestStatus.OPEN);
        }
        if (serviceRequest.getPriority() == null) {
            serviceRequest.setPriority(ServiceRequest.Priority.MEDIUM);
        }
        applyDefaultDueDate(serviceRequest);
        if (serviceRequest.getManagerId() != null && serviceRequest.getAssignedAt() == null) {
            serviceRequest.setAssignedAt(getTodayDateString());
            if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.OPEN) {
                serviceRequest.setStatus(ServiceRequest.RequestStatus.ASSIGNED);
            }
        }

        serviceRequestMapper.insert(serviceRequest);
        recordHistory(serviceRequest.getId(), "CREATE", null,
                serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null,
                null, serviceRequest.getManagerId(), "요청 생성", userId);

        if (serviceRequest.getManagerId() != null) {
            recordHistory(serviceRequest.getId(), "MANAGER_ASSIGNED", null, null,
                    null, serviceRequest.getManagerId(), "담당자 배정", userId);
        }

        // Link attachments if provided
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            for (com.example.customerservice.dto.AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getId() != null) {
                    attachmentService.linkToServiceRequest(serviceRequest.getId(), attachmentDTO.getId());
                }
            }
        }

        String actorUserKey = getActorUserKey(userId);

        populateProjectName(serviceRequest);

        // Send email notification to manager if assigned
        if (dto.getManagerId() != null) {
            User manager = userMapper.findById(dto.getManagerId()).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendServiceRequestCreatedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
            if (manager != null && !isActor(manager.getUserId(), actorUserKey)) {
                notificationService.sendServiceRequestCreated(serviceRequest, manager.getUserId());
            }
        }

        if (serviceRequest.getProjectId() != null) {
            notifyProjectManagers(serviceRequest.getProjectId(), serviceRequest, actorUserKey);
        }

        if (!isActor(customer.getUserId(), actorUserKey)) {
            notificationService.sendServiceRequestCreated(serviceRequest, customer.getUserId());
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
        if (serviceRequest.getReceivedAt() == null || serviceRequest.getReceivedAt().isBlank()) {
            serviceRequest.setReceivedAt(getTodayDateString());
        }

        // Set default values if not provided
        if (serviceRequest.getStatus() == null) {
            serviceRequest.setStatus(ServiceRequest.RequestStatus.OPEN);
        }
        if (serviceRequest.getPriority() == null) {
            serviceRequest.setPriority(ServiceRequest.Priority.MEDIUM);
        }
        applyDefaultDueDate(serviceRequest);
        if (serviceRequest.getManagerId() != null && serviceRequest.getAssignedAt() == null) {
            serviceRequest.setAssignedAt(getTodayDateString());
            if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.OPEN) {
                serviceRequest.setStatus(ServiceRequest.RequestStatus.ASSIGNED);
            }
        }

        serviceRequestMapper.insert(serviceRequest);
        recordHistory(serviceRequest.getId(), "CREATE", null,
                serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null,
                null, serviceRequest.getManagerId(), "요청 생성", null);

        if (serviceRequest.getManagerId() != null) {
            recordHistory(serviceRequest.getId(), "MANAGER_ASSIGNED", null, null,
                    null, serviceRequest.getManagerId(), "담당자 배정", null);
        }

        // Link attachments if provided
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            for (com.example.customerservice.dto.AttachmentDTO attachmentDTO : dto.getAttachments()) {
                if (attachmentDTO.getId() != null) {
                    attachmentService.linkToServiceRequest(serviceRequest.getId(), attachmentDTO.getId());
                }
            }
        }

        populateProjectName(serviceRequest);

        // Send email notification to manager if assigned
        if (dto.getManagerId() != null) {
            User manager = userMapper.findById(dto.getManagerId()).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendServiceRequestCreatedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
            if (manager != null) {
                notificationService.sendServiceRequestCreated(serviceRequest, manager.getUserId());
            }
        }

        if (serviceRequest.getProjectId() != null) {
            notifyProjectManagers(serviceRequest.getProjectId(), serviceRequest, null);
        }

        notificationService.sendServiceRequestCreated(serviceRequest, customer.getUserId());

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO updateServiceRequest(Long id, ServiceRequestDTO dto, Long actorUserId) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        Long oldManagerId = serviceRequest.getManagerId();

        serviceRequest.setTitle(dto.getTitle());
        serviceRequest.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            serviceRequest.setStatus(dto.getStatus());
        }
        serviceRequest.setPriority(dto.getPriority());
        if (dto.getManagerId() != null) {
            serviceRequest.setManagerId(dto.getManagerId());
            if (!dto.getManagerId().equals(oldManagerId) && serviceRequest.getAssignedAt() == null) {
                serviceRequest.setAssignedAt(getTodayDateString());
            }
        }
        serviceRequest.setProjectId(dto.getProjectId());
        serviceRequest.setDueDate(dto.getDueDate());
        serviceRequest.setResolvedAt(dto.getResolvedAt());
        serviceRequest.setReceivedAt(dto.getReceivedAt());
        serviceRequest.setUpdatedAt(LocalDateTime.now());
        if (serviceRequest.getDueDate() == null || serviceRequest.getDueDate().isBlank()) {
            applyDefaultDueDate(serviceRequest);
        }
        applyWorkflowTimestamp(serviceRequest, serviceRequest.getStatus(), oldStatus);

        // Set resolvedAt when status changes to RESOLVED
        if (dto.getStatus() == ServiceRequest.RequestStatus.RESOLVED &&
            oldStatus != ServiceRequest.RequestStatus.RESOLVED) {
            if (serviceRequest.getResolvedAt() == null || serviceRequest.getResolvedAt().isBlank()) {
                serviceRequest.setResolvedAt(getTodayDateString());
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
        String actorUserKey = getActorUserKey(actorUserId);

        // 1. If manager changed, notify new manager
        if (dto.getManagerId() != null && !dto.getManagerId().equals(oldManagerId)) {
            User manager = userMapper.findById(dto.getManagerId()).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendManagerAssignedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
            if (manager != null && !isActor(manager.getUserId(), actorUserKey)) {
                notificationService.sendManagerAssigned(serviceRequest, manager.getUserId(), manager.getUsername());
            }
        }

        // 2. If status changed, notify customer
        if (serviceRequest.getStatus() != oldStatus) {
            populateProjectName(serviceRequest);
            User customer = userMapper.findById(serviceRequest.getCustomerId()).orElse(null);
            if (customer != null && customer.getEmail() != null) {
                if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.RESOLVED) {
                    emailService.sendServiceRequestResolvedEmail(customer.getEmail(), serviceRequest.getTitle(), serviceRequest.getResolutionNotes());
                } else {
                    emailService.sendServiceRequestStatusChangedEmail(customer.getEmail(), serviceRequest.getTitle(),
                        oldStatus != null ? oldStatus.name() : "UNKNOWN", serviceRequest.getStatus().name());
                }
            }
            if (customer != null && !isActor(customer.getUserId(), actorUserKey)) {
                if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.IN_PROGRESS) {
                    notificationService.sendManagerAssigned(serviceRequest, customer.getUserId(), null);
                } else {
                    notificationService.sendServiceRequestStatusUpdated(serviceRequest, customer.getUserId());
                }
            }
        }

        if (serviceRequest.getStatus() != oldStatus) {
            recordHistory(serviceRequest.getId(), "STATUS_CHANGED",
                    oldStatus != null ? oldStatus.name() : null,
                    serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null,
                    oldManagerId, serviceRequest.getManagerId(),
                    "상태 변경", actorUserId);
        }

        if (dto.getManagerId() != null && !dto.getManagerId().equals(oldManagerId)) {
            recordHistory(serviceRequest.getId(), "MANAGER_ASSIGNED",
                    oldStatus != null ? oldStatus.name() : null,
                    serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null,
                    oldManagerId, dto.getManagerId(),
                    "담당자 변경", actorUserId);
        }

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status, Long actorUserId) {
        return updateServiceRequestStatus(id, status, null, null, null, actorUserId);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status,
                                                        Double hoursSpent, String resolutionNotes, Long actorUserId) {
        return updateServiceRequestStatus(id, status, hoursSpent, resolutionNotes, null, actorUserId);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status,
                                                        Double hoursSpent, String resolutionNotes,
                                                        List<com.example.customerservice.dto.AttachmentDTO> attachments,
                                                        Long actorUserId) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        serviceRequest.setStatus(status);
        serviceRequest.setUpdatedAt(LocalDateTime.now());
        applyWorkflowTimestamp(serviceRequest, status, oldStatus);

        // Set resolvedAt when status changes to RESOLVED
        if (status == ServiceRequest.RequestStatus.RESOLVED &&
            oldStatus != ServiceRequest.RequestStatus.RESOLVED) {
            if (serviceRequest.getResolvedAt() == null || serviceRequest.getResolvedAt().isBlank()) {
                serviceRequest.setResolvedAt(getTodayDateString());
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
        String actorUserKey = getActorUserKey(actorUserId);
        if (status != oldStatus) {
            populateProjectName(serviceRequest);
            User customer = userMapper.findById(serviceRequest.getCustomerId()).orElse(null);
            if (customer != null && customer.getEmail() != null) {
                if (status == ServiceRequest.RequestStatus.RESOLVED) {
                    emailService.sendServiceRequestResolvedEmail(customer.getEmail(), serviceRequest.getTitle(), serviceRequest.getResolutionNotes());
                } else {
                    emailService.sendServiceRequestStatusChangedEmail(customer.getEmail(), serviceRequest.getTitle(),
                        oldStatus != null ? oldStatus.name() : "UNKNOWN", status.name());
                }
            }
            if (customer != null && !isActor(customer.getUserId(), actorUserKey)) {
                if (status == ServiceRequest.RequestStatus.IN_PROGRESS) {
                    notificationService.sendManagerAssigned(serviceRequest, customer.getUserId(), null);
                } else {
                    notificationService.sendServiceRequestStatusUpdated(serviceRequest, customer.getUserId());
                }
            }
        }

        if (status != oldStatus) {
            recordHistory(serviceRequest.getId(), "STATUS_CHANGED",
                    oldStatus != null ? oldStatus.name() : null,
                    status != null ? status.name() : null,
                    serviceRequest.getManagerId(), serviceRequest.getManagerId(),
                    "상태 변경", actorUserId);
        }

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO updateServiceRequestStatus(Long id, ServiceRequest.RequestStatus status,
                                                        Long managerId, Long actorUserId) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        Long oldManagerId = serviceRequest.getManagerId();

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
            if (serviceRequest.getAssignedAt() == null || serviceRequest.getAssignedAt().isBlank()) {
                serviceRequest.setAssignedAt(getTodayDateString());
            }
        }

        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        serviceRequest.setStatus(status);
        serviceRequest.setUpdatedAt(LocalDateTime.now());
        applyWorkflowTimestamp(serviceRequest, status, oldStatus);

        // Set resolvedAt when status changes to RESOLVED
        if (status == ServiceRequest.RequestStatus.RESOLVED &&
            oldStatus != ServiceRequest.RequestStatus.RESOLVED) {
            if (serviceRequest.getResolvedAt() == null || serviceRequest.getResolvedAt().isBlank()) {
                serviceRequest.setResolvedAt(getTodayDateString());
            }
        }

        serviceRequestMapper.update(serviceRequest);

        // Send email notifications
        String actorUserKey = getActorUserKey(actorUserId);

        // 1. If manager assigned, notify manager
        if (status == ServiceRequest.RequestStatus.IN_PROGRESS && oldStatus != ServiceRequest.RequestStatus.IN_PROGRESS && managerId != null) {
            User manager = userMapper.findById(managerId).orElse(null);
            if (manager != null && manager.getEmail() != null) {
                emailService.sendManagerAssignedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
            }
            if (manager != null && !isActor(manager.getUserId(), actorUserKey)) {
                notificationService.sendManagerAssigned(serviceRequest, manager.getUserId(), manager.getUsername());
            }
        }

        // 2. If status changed, notify customer
        if (status != oldStatus) {
            populateProjectName(serviceRequest);
            User customer = userMapper.findById(serviceRequest.getCustomerId()).orElse(null);
            if (customer != null && customer.getEmail() != null) {
                if (status == ServiceRequest.RequestStatus.RESOLVED) {
                    emailService.sendServiceRequestResolvedEmail(customer.getEmail(), serviceRequest.getTitle(), serviceRequest.getResolutionNotes());
                } else {
                    emailService.sendServiceRequestStatusChangedEmail(customer.getEmail(), serviceRequest.getTitle(),
                        oldStatus != null ? oldStatus.name() : "UNKNOWN", status.name());
                }
            }
            if (customer != null && !isActor(customer.getUserId(), actorUserKey)) {
                if (status == ServiceRequest.RequestStatus.IN_PROGRESS) {
                    notificationService.sendManagerAssigned(serviceRequest, customer.getUserId(), null);
                } else {
                    notificationService.sendServiceRequestStatusUpdated(serviceRequest, customer.getUserId());
                }
            }
        }

        if (status != oldStatus) {
            recordHistory(serviceRequest.getId(), "STATUS_CHANGED",
                    oldStatus != null ? oldStatus.name() : null,
                    status != null ? status.name() : null,
                    oldManagerId, serviceRequest.getManagerId(),
                    "상태 변경", actorUserId);
        }

        if (status == ServiceRequest.RequestStatus.IN_PROGRESS && managerId != null &&
            (oldManagerId == null || !oldManagerId.equals(managerId))) {
            recordHistory(serviceRequest.getId(), "MANAGER_ASSIGNED",
                    oldStatus != null ? oldStatus.name() : null,
                    status != null ? status.name() : null,
                    oldManagerId, managerId,
                    "담당자 배정", actorUserId);
        }

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO triageServiceRequest(Long id, String note, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.OPEN, ServiceRequest.RequestStatus.REOPENED);
        return transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.TRIAGE, "TRIAGE_STARTED",
                defaultNote(note, "접수 검토 시작"), actorUserId);
    }

    public ServiceRequestDTO assignServiceRequest(Long id, Long managerId, String note, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.OPEN, ServiceRequest.RequestStatus.TRIAGE,
                ServiceRequest.RequestStatus.REOPENED, ServiceRequest.RequestStatus.HOLD,
                ServiceRequest.RequestStatus.WAITING_CUSTOMER);

        User manager = userMapper.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found with id: " + managerId));
        if (manager.getRole() != User.Role.ROLE_MANAGER) {
            throw new RuntimeException("Assigned user is not a manager");
        }

        Long oldManagerId = serviceRequest.getManagerId();
        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        serviceRequest.setManagerId(managerId);
        serviceRequest.setStatus(ServiceRequest.RequestStatus.ASSIGNED);
        serviceRequest.setAssignedAt(getTodayDateString());
        serviceRequest.setUpdatedAt(LocalDateTime.now());
        serviceRequestMapper.update(serviceRequest);

        recordHistory(serviceRequest.getId(), "MANAGER_ASSIGNED",
                oldStatus != null ? oldStatus.name() : null,
                ServiceRequest.RequestStatus.ASSIGNED.name(),
                oldManagerId, managerId,
                defaultNote(note, "담당자 배정"), actorUserId);

        String actorUserKey = getActorUserKey(actorUserId);
        if (manager.getEmail() != null) {
            emailService.sendManagerAssignedEmail(manager.getEmail(), serviceRequest.getTitle(), serviceRequest.getId());
        }
        if (!isActor(manager.getUserId(), actorUserKey)) {
            notificationService.sendManagerAssigned(serviceRequest, manager.getUserId(), manager.getUsername());
        }
        notifyCustomerStatusChanged(serviceRequest, oldStatus, actorUserId);

        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO startServiceRequest(Long id, Long managerId, String note, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.OPEN, ServiceRequest.RequestStatus.TRIAGE,
                ServiceRequest.RequestStatus.ASSIGNED, ServiceRequest.RequestStatus.REOPENED,
                ServiceRequest.RequestStatus.HOLD, ServiceRequest.RequestStatus.WAITING_CUSTOMER);

        Long oldManagerId = serviceRequest.getManagerId();
        if (managerId != null) {
            if (oldManagerId != null && !oldManagerId.equals(managerId)) {
                throw new RuntimeException("This request is already assigned to another manager");
            }
            serviceRequest.setManagerId(managerId);
            if (serviceRequest.getAssignedAt() == null || serviceRequest.getAssignedAt().isBlank()) {
                serviceRequest.setAssignedAt(getTodayDateString());
            }
        }
        ServiceRequestDTO result = transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.IN_PROGRESS,
                "WORK_STARTED", defaultNote(note, "처리 시작"), actorUserId);

        if (managerId != null && (oldManagerId == null || !oldManagerId.equals(managerId))) {
            recordHistory(serviceRequest.getId(), "MANAGER_ASSIGNED", null,
                    ServiceRequest.RequestStatus.IN_PROGRESS.name(), oldManagerId, managerId,
                    "담당자 배정", actorUserId);
        }
        return result;
    }

    public ServiceRequestDTO holdServiceRequest(Long id, String note, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.ASSIGNED, ServiceRequest.RequestStatus.IN_PROGRESS,
                ServiceRequest.RequestStatus.REOPENED, ServiceRequest.RequestStatus.WAITING_CUSTOMER);
        return transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.HOLD, "WORK_HELD",
                defaultNote(note, "내부 보류"), actorUserId);
    }

    public ServiceRequestDTO waitCustomerServiceRequest(Long id, String note, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.IN_PROGRESS, ServiceRequest.RequestStatus.REOPENED);
        return transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.WAITING_CUSTOMER, "WAITING_CUSTOMER",
                defaultNote(note, "고객 응답 대기"), actorUserId);
    }

    public ServiceRequestDTO resolveServiceRequest(Long id, Double hoursSpent, String resolutionNotes,
                                                   List<com.example.customerservice.dto.AttachmentDTO> attachments,
                                                   String note, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.IN_PROGRESS, ServiceRequest.RequestStatus.REOPENED,
                ServiceRequest.RequestStatus.HOLD, ServiceRequest.RequestStatus.WAITING_CUSTOMER,
                ServiceRequest.RequestStatus.RESOLVED);
        if (hoursSpent == null || resolutionNotes == null || resolutionNotes.isBlank()) {
            throw new RuntimeException("Hours spent and resolution notes are required");
        }
        serviceRequest.setHoursSpent(hoursSpent);
        serviceRequest.setResolutionNotes(resolutionNotes);
        syncResolutionAttachments(serviceRequest.getId(), attachments);
        return transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.RESOLVED, "RESOLUTION_SUBMITTED",
                defaultNote(note, "완료보고"), actorUserId);
    }

    public ServiceRequestDTO closeServiceRequest(Long id, String note, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.RESOLVED);
        return transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.CLOSED, "CUSTOMER_CLOSED",
                defaultNote(note, "고객 확인 종료"), actorUserId);
    }

    public ServiceRequestDTO rejectResolution(Long id, String reason, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        assertCurrentStatus(serviceRequest, ServiceRequest.RequestStatus.RESOLVED);
        return transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.REOPENED, "RESOLUTION_REJECTED",
                defaultNote(reason, "고객 반려"), actorUserId);
    }

    public ServiceRequestDTO cancelServiceRequest(Long id, String reason, Long actorUserId) {
        ServiceRequest serviceRequest = getServiceRequestEntityById(id);
        if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.CLOSED ||
            serviceRequest.getStatus() == ServiceRequest.RequestStatus.CANCELLED) {
            throw new RuntimeException("Closed or cancelled requests cannot be cancelled again");
        }
        return transitionServiceRequest(serviceRequest, ServiceRequest.RequestStatus.CANCELLED, "REQUEST_CANCELLED",
                defaultNote(reason, "요청 취소"), actorUserId);
    }

    public ServiceRequestDTO unassignServiceRequest(Long id, Long actorUserId) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));
        Long oldManagerId = serviceRequest.getManagerId();
        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();

        serviceRequestMapper.unassign(id);

        recordHistory(id, "MANAGER_UNASSIGNED",
                oldStatus != null ? oldStatus.name() : null,
                ServiceRequest.RequestStatus.OPEN.name(),
                oldManagerId, null,
                "담당자 해제", actorUserId);

        return getServiceRequestById(id);
    }

    public void deleteServiceRequest(Long id) {
        if (!serviceRequestMapper.existsById(id)) {
            throw new RuntimeException("Service request not found with id: " + id);
        }
        serviceRequestMapper.deleteById(id);
    }

    private ServiceRequestDTO transitionServiceRequest(ServiceRequest serviceRequest,
                                                       ServiceRequest.RequestStatus nextStatus,
                                                       String eventType,
                                                       String note,
                                                       Long actorUserId) {
        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();
        Long oldManagerId = serviceRequest.getManagerId();

        serviceRequest.setStatus(nextStatus);
        serviceRequest.setUpdatedAt(LocalDateTime.now());
        applyWorkflowTimestamp(serviceRequest, nextStatus, oldStatus);
        serviceRequestMapper.update(serviceRequest);

        recordHistory(serviceRequest.getId(), eventType,
                oldStatus != null ? oldStatus.name() : null,
                nextStatus != null ? nextStatus.name() : null,
                oldManagerId, serviceRequest.getManagerId(),
                note, actorUserId);

        notifyCustomerStatusChanged(serviceRequest, oldStatus, actorUserId);

        return convertToDTO(serviceRequest);
    }

    private void assertCurrentStatus(ServiceRequest serviceRequest, ServiceRequest.RequestStatus... allowedStatuses) {
        for (ServiceRequest.RequestStatus allowedStatus : allowedStatuses) {
            if (serviceRequest.getStatus() == allowedStatus) {
                return;
            }
        }
        throw new RuntimeException("Current status cannot be changed by this action: " + serviceRequest.getStatus());
    }

    private String defaultNote(String note, String fallback) {
        if (note == null || note.isBlank()) {
            return fallback;
        }
        return note;
    }

    private void applyDefaultDueDate(ServiceRequest serviceRequest) {
        if (serviceRequest.getDueDate() != null && !serviceRequest.getDueDate().isBlank()) {
            return;
        }
        String baseDate = serviceRequest.getReceivedAt();
        if (baseDate == null || baseDate.isBlank()) {
            baseDate = getTodayDateString();
        }
        int days = switch (serviceRequest.getPriority() != null ? serviceRequest.getPriority() : ServiceRequest.Priority.MEDIUM) {
            case URGENT -> 1;
            case HIGH -> 3;
            case MEDIUM -> 7;
            case LOW -> 14;
        };
        serviceRequest.setDueDate(addDays(baseDate, days));
    }

    private String addDays(String yyyymmdd, int days) {
        try {
            return LocalDate.parse(yyyymmdd, DateTimeFormatter.ofPattern("yyyyMMdd"))
                    .plusDays(days)
                    .format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        } catch (Exception e) {
            return LocalDate.now().plusDays(days).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }
    }

    private void applyWorkflowTimestamp(ServiceRequest serviceRequest,
                                        ServiceRequest.RequestStatus nextStatus,
                                        ServiceRequest.RequestStatus oldStatus) {
        if (nextStatus == oldStatus) {
            return;
        }
        String today = getTodayDateString();
        if (nextStatus == ServiceRequest.RequestStatus.ASSIGNED &&
            (serviceRequest.getAssignedAt() == null || serviceRequest.getAssignedAt().isBlank())) {
            serviceRequest.setAssignedAt(today);
        }
        if (nextStatus == ServiceRequest.RequestStatus.IN_PROGRESS &&
            (serviceRequest.getStartedAt() == null || serviceRequest.getStartedAt().isBlank())) {
            serviceRequest.setStartedAt(today);
        }
        if (nextStatus == ServiceRequest.RequestStatus.RESOLVED &&
            (serviceRequest.getResolvedAt() == null || serviceRequest.getResolvedAt().isBlank())) {
            serviceRequest.setResolvedAt(today);
        }
        if (nextStatus == ServiceRequest.RequestStatus.CLOSED &&
            (serviceRequest.getClosedAt() == null || serviceRequest.getClosedAt().isBlank())) {
            serviceRequest.setClosedAt(today);
        }
        if (nextStatus == ServiceRequest.RequestStatus.CANCELLED &&
            (serviceRequest.getCancelledAt() == null || serviceRequest.getCancelledAt().isBlank())) {
            serviceRequest.setCancelledAt(today);
        }
        if (nextStatus == ServiceRequest.RequestStatus.REOPENED) {
            serviceRequest.setReopenedAt(today);
        }
    }

    private void syncResolutionAttachments(Long id, List<com.example.customerservice.dto.AttachmentDTO> attachments) {
        if (attachments == null) {
            return;
        }

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

    private void notifyCustomerStatusChanged(ServiceRequest serviceRequest,
                                             ServiceRequest.RequestStatus oldStatus,
                                             Long actorUserId) {
        if (serviceRequest.getStatus() == oldStatus) {
            return;
        }
        populateProjectName(serviceRequest);
        String actorUserKey = getActorUserKey(actorUserId);
        User customer = userMapper.findById(serviceRequest.getCustomerId()).orElse(null);
        if (customer == null) {
            return;
        }
        if (customer.getEmail() != null) {
            if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.RESOLVED) {
                emailService.sendServiceRequestResolvedEmail(customer.getEmail(), serviceRequest.getTitle(), serviceRequest.getResolutionNotes());
            } else {
                emailService.sendServiceRequestStatusChangedEmail(customer.getEmail(), serviceRequest.getTitle(),
                        oldStatus != null ? oldStatus.name() : "UNKNOWN", serviceRequest.getStatus().name());
            }
        }
        if (!isActor(customer.getUserId(), actorUserKey)) {
            notificationService.sendServiceRequestStatusUpdated(serviceRequest, customer.getUserId());
        }
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
            dto.setCustomerProfilePictureId(customer.getProfilePictureId());
            dto.setCustomerEmail(customer.getEmail());
            if (customer.getCompanyId() != null) {
                com.example.customerservice.model.Company company =
                    companyMapper.findById(customer.getCompanyId()).orElse(null);
                if (company != null) {
                    dto.setCompanyName(company.getCompanyName());
                }
            }
        }

        // Load manager details for DTO
        if (serviceRequest.getManagerId() != null) {
            User manager = userMapper.findById(serviceRequest.getManagerId())
                    .orElse(null);
            if (manager != null) {
                dto.setManagerName(manager.getUsername());
                dto.setManagerProfilePictureId(manager.getProfilePictureId());
                dto.setManagerEmail(manager.getEmail());
            }
        }

        // Load project details for DTO
        dto.setProjectId(serviceRequest.getProjectId());
        if (serviceRequest.getProjectName() != null && !serviceRequest.getProjectName().isBlank()) {
            dto.setProjectName(serviceRequest.getProjectName());
        } else if (serviceRequest.getProjectId() != null) {
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
        dto.setReceivedAt(serviceRequest.getReceivedAt());
        dto.setHoursSpent(serviceRequest.getHoursSpent());
        dto.setResolutionNotes(serviceRequest.getResolutionNotes());
        dto.setDueDate(serviceRequest.getDueDate());
        dto.setAssignedAt(serviceRequest.getAssignedAt());
        dto.setStartedAt(serviceRequest.getStartedAt());
        dto.setClosedAt(serviceRequest.getClosedAt());
        dto.setCancelledAt(serviceRequest.getCancelledAt());
        dto.setReopenedAt(serviceRequest.getReopenedAt());

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
        serviceRequest.setResolvedAt(dto.getResolvedAt());
        serviceRequest.setReceivedAt(dto.getReceivedAt());
        serviceRequest.setAssignedAt(dto.getAssignedAt());
        serviceRequest.setStartedAt(dto.getStartedAt());
        serviceRequest.setClosedAt(dto.getClosedAt());
        serviceRequest.setCancelledAt(dto.getCancelledAt());
        serviceRequest.setReopenedAt(dto.getReopenedAt());
        return serviceRequest;
    }

    private void recordHistory(Long serviceRequestId, String eventType, String fromStatus, String toStatus,
                               Long fromManagerId, Long toManagerId, String note, Long createdByUserId) {
        ServiceRequestHistory history = new ServiceRequestHistory();
        history.setServiceRequestId(serviceRequestId);
        history.setEventType(eventType);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setFromManagerId(fromManagerId);
        history.setToManagerId(toManagerId);
        history.setNote(note);
        history.setCreatedByUserId(createdByUserId);
        history.setCreatedAt(LocalDateTime.now());
        serviceRequestHistoryMapper.insert(history);
    }

    private ServiceRequestHistoryDTO convertToHistoryDTO(ServiceRequestHistory history) {
        ServiceRequestHistoryDTO dto = new ServiceRequestHistoryDTO();
        dto.setId(history.getId());
        dto.setServiceRequestId(history.getServiceRequestId());
        dto.setEventType(history.getEventType());
        dto.setFromStatus(history.getFromStatus());
        dto.setToStatus(history.getToStatus());
        dto.setFromManagerId(history.getFromManagerId());
        dto.setToManagerId(history.getToManagerId());
        dto.setNote(history.getNote());
        dto.setCreatedByUserId(history.getCreatedByUserId());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }

    private String getTodayDateString() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    }

    private String getActorUserKey(Long actorUserId) {
        if (actorUserId == null) {
            return null;
        }
        return userMapper.findById(actorUserId)
            .map(User::getUserId)
            .orElse(null);
    }

    private boolean isActor(String recipientUserId, String actorUserId) {
        if (recipientUserId == null || actorUserId == null) {
            return false;
        }
        return recipientUserId.equals(actorUserId);
    }

    private void notifyProjectManagers(Long projectId, ServiceRequest serviceRequest, String actorUserKey) {
        List<User> managers = userMapper.findManagersByProjectId(projectId);
        if (managers == null || managers.isEmpty()) {
            return;
        }
        for (User manager : managers) {
            if (manager == null) {
                continue;
            }
            if (actorUserKey != null && isActor(manager.getUserId(), actorUserKey)) {
                continue;
            }
            notificationService.sendServiceRequestCreated(serviceRequest, manager.getUserId());
        }
    }

    private void populateProjectName(ServiceRequest serviceRequest) {
        if (serviceRequest == null) {
            return;
        }
        if (serviceRequest.getProjectName() != null && !serviceRequest.getProjectName().isBlank()) {
            return;
        }
        if (serviceRequest.getProjectId() == null) {
            return;
        }
        projectMapper.findById(serviceRequest.getProjectId())
            .map(Project::getProjectName)
            .ifPresent(serviceRequest::setProjectName);
    }
}
