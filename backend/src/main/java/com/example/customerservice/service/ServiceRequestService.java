package com.example.customerservice.service;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.mapper.CustomerMapper;
import com.example.customerservice.mapper.ServiceRequestMapper;
import com.example.customerservice.model.Customer;
import com.example.customerservice.model.ServiceRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServiceRequestService {

    @Autowired
    private ServiceRequestMapper serviceRequestMapper;

    @Autowired
    private CustomerMapper customerMapper;

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

    public List<ServiceRequestDTO> getServiceRequestsByUserId(Long userId) {
        return serviceRequestMapper.findByCreatedByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ServiceRequest getServiceRequestEntityById(Long id) {
        return serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));
    }

    public ServiceRequestDTO createServiceRequest(ServiceRequestDTO dto, Long userId) {
        Customer customer = customerMapper.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));

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
        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO createServiceRequest(ServiceRequestDTO dto) {
        Customer customer = customerMapper.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));

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
        return convertToDTO(serviceRequest);
    }

    public ServiceRequestDTO updateServiceRequest(Long id, ServiceRequestDTO dto) {
        ServiceRequest serviceRequest = serviceRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        ServiceRequest.RequestStatus oldStatus = serviceRequest.getStatus();

        serviceRequest.setTitle(dto.getTitle());
        serviceRequest.setDescription(dto.getDescription());
        serviceRequest.setStatus(dto.getStatus());
        serviceRequest.setPriority(dto.getPriority());
        serviceRequest.setAssignedTo(dto.getAssignedTo());
        serviceRequest.setUpdatedAt(LocalDateTime.now());

        // Set resolvedAt when status changes to RESOLVED or CLOSED
        if ((dto.getStatus() == ServiceRequest.RequestStatus.RESOLVED ||
             dto.getStatus() == ServiceRequest.RequestStatus.CLOSED) &&
            (oldStatus != ServiceRequest.RequestStatus.RESOLVED &&
             oldStatus != ServiceRequest.RequestStatus.CLOSED)) {
            if (serviceRequest.getResolvedAt() == null) {
                serviceRequest.setResolvedAt(LocalDateTime.now());
            }
        }

        if (dto.getCustomerId() != null && !serviceRequest.getCustomerId().equals(dto.getCustomerId())) {
            Customer customer = customerMapper.findById(dto.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));
            serviceRequest.setCustomerId(customer.getId());
        }

        serviceRequestMapper.update(serviceRequest);
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

        // Load customer details for DTO
        Customer customer = customerMapper.findById(serviceRequest.getCustomerId())
                .orElse(null);
        if (customer != null) {
            dto.setCustomerName(customer.getName());
            dto.setCustomerEmail(customer.getEmail());
        }

        dto.setAssignedTo(serviceRequest.getAssignedTo());
        dto.setCreatedByUserId(serviceRequest.getCreatedByUserId());
        dto.setCreatedAt(serviceRequest.getCreatedAt());
        dto.setUpdatedAt(serviceRequest.getUpdatedAt());
        dto.setResolvedAt(serviceRequest.getResolvedAt());
        return dto;
    }

    private ServiceRequest convertToEntity(ServiceRequestDTO dto) {
        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setTitle(dto.getTitle());
        serviceRequest.setDescription(dto.getDescription());
        serviceRequest.setStatus(dto.getStatus());
        serviceRequest.setPriority(dto.getPriority());
        serviceRequest.setAssignedTo(dto.getAssignedTo());
        return serviceRequest;
    }
}
