package com.example.customerservice.service;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.model.Customer;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.repository.CustomerRepository;
import com.example.customerservice.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServiceRequestService {

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private CustomerRepository customerRepository;

    public List<ServiceRequestDTO> getAllServiceRequests() {
        return serviceRequestRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ServiceRequestDTO getServiceRequestById(Long id) {
        ServiceRequest serviceRequest = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));
        return convertToDTO(serviceRequest);
    }

    public List<ServiceRequestDTO> getServiceRequestsByCustomerId(Long customerId) {
        return serviceRequestRepository.findByCustomerId(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getServiceRequestsByStatus(ServiceRequest.RequestStatus status) {
        return serviceRequestRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getServiceRequestsByPriority(ServiceRequest.Priority priority) {
        return serviceRequestRepository.findByPriority(priority).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ServiceRequestDTO createServiceRequest(ServiceRequestDTO dto) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));

        ServiceRequest serviceRequest = convertToEntity(dto);
        serviceRequest.setCustomer(customer);

        ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);
        return convertToDTO(savedRequest);
    }

    public ServiceRequestDTO updateServiceRequest(Long id, ServiceRequestDTO dto) {
        ServiceRequest serviceRequest = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found with id: " + id));

        serviceRequest.setTitle(dto.getTitle());
        serviceRequest.setDescription(dto.getDescription());
        serviceRequest.setStatus(dto.getStatus());
        serviceRequest.setPriority(dto.getPriority());
        serviceRequest.setAssignedTo(dto.getAssignedTo());

        if (dto.getCustomerId() != null && !serviceRequest.getCustomer().getId().equals(dto.getCustomerId())) {
            Customer customer = customerRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + dto.getCustomerId()));
            serviceRequest.setCustomer(customer);
        }

        ServiceRequest updatedRequest = serviceRequestRepository.save(serviceRequest);
        return convertToDTO(updatedRequest);
    }

    public void deleteServiceRequest(Long id) {
        if (!serviceRequestRepository.existsById(id)) {
            throw new RuntimeException("Service request not found with id: " + id);
        }
        serviceRequestRepository.deleteById(id);
    }

    private ServiceRequestDTO convertToDTO(ServiceRequest serviceRequest) {
        ServiceRequestDTO dto = new ServiceRequestDTO();
        dto.setId(serviceRequest.getId());
        dto.setTitle(serviceRequest.getTitle());
        dto.setDescription(serviceRequest.getDescription());
        dto.setStatus(serviceRequest.getStatus());
        dto.setPriority(serviceRequest.getPriority());
        dto.setCustomerId(serviceRequest.getCustomer().getId());
        dto.setCustomerName(serviceRequest.getCustomer().getName());
        dto.setCustomerEmail(serviceRequest.getCustomer().getEmail());
        dto.setAssignedTo(serviceRequest.getAssignedTo());
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
