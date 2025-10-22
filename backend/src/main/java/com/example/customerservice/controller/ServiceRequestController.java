package com.example.customerservice.controller;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService serviceRequestService;

    @GetMapping
    public ResponseEntity<List<ServiceRequestDTO>> getAllServiceRequests() {
        List<ServiceRequestDTO> requests = serviceRequestService.getAllServiceRequests();
        return ResponseEntity.ok(requests);
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
    public ResponseEntity<?> createServiceRequest(@Valid @RequestBody ServiceRequestDTO dto) {
        try {
            ServiceRequestDTO createdRequest = serviceRequestService.createServiceRequest(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateServiceRequest(@PathVariable Long id, @Valid @RequestBody ServiceRequestDTO dto) {
        try {
            ServiceRequestDTO updatedRequest = serviceRequestService.updateServiceRequest(id, dto);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteServiceRequest(@PathVariable Long id) {
        try {
            serviceRequestService.deleteServiceRequest(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
