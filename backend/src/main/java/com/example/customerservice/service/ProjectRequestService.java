package com.example.customerservice.service;

import com.example.customerservice.dto.ProjectRequestDTO;
import com.example.customerservice.mapper.CompanyMapper;
import com.example.customerservice.mapper.ProjectMapper;
import com.example.customerservice.mapper.ProjectRequestMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.Company;
import com.example.customerservice.model.Project;
import com.example.customerservice.model.ProjectRequest;
import com.example.customerservice.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectRequestService {

    @Autowired
    private ProjectRequestMapper projectRequestMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private CompanyMapper companyMapper;

    @Autowired
    private UserMapper userMapper;

    public List<ProjectRequestDTO> getAllProjectRequests() {
        return projectRequestMapper.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProjectRequestDTO getProjectRequestById(Long id) {
        ProjectRequest projectRequest = projectRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Project request not found with id: " + id));
        return convertToDTO(projectRequest);
    }

    public List<ProjectRequestDTO> getProjectRequestsByUserId(Long userId) {
        return projectRequestMapper.findByRequestedByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectRequestDTO> getProjectRequestsByStatus(String status) {
        return projectRequestMapper.findByRequestStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectRequestDTO> getProjectRequestsByCompanyId(Long companyId) {
        return projectRequestMapper.findByCompanyId(companyId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProjectRequestDTO createProjectRequest(ProjectRequestDTO dto, Long requestedByUserId) {
        // Validate user exists and get their company
        User user = userMapper.findById(requestedByUserId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + requestedByUserId));

        if (user.getRole() != User.Role.ROLE_CUSTOMER) {
            throw new RuntimeException("Only customers can request projects");
        }

        if (user.getCompanyId() == null) {
            throw new RuntimeException("User is not assigned to a company");
        }

        // Validate company exists
        Company company = companyMapper.findById(user.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + user.getCompanyId()));

        // Validate dates
        if (dto.getContractEndDate().isBefore(dto.getContractStartDate())) {
            throw new RuntimeException("Contract end date must be after start date");
        }

        ProjectRequest projectRequest = convertToEntity(dto);
        projectRequest.setRequestedByUserId(requestedByUserId);
        projectRequest.setCompanyId(user.getCompanyId());
        projectRequest.setRequestStatus(ProjectRequest.RequestStatus.PENDING);
        projectRequest.setCreatedAt(LocalDateTime.now());
        projectRequest.setUpdatedAt(LocalDateTime.now());

        projectRequestMapper.insert(projectRequest);
        return convertToDTO(projectRequest);
    }

    public ProjectRequestDTO updateProjectRequest(Long id, ProjectRequestDTO dto) {
        ProjectRequest projectRequest = projectRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Project request not found with id: " + id));

        // Only allow updates if still pending
        if (projectRequest.getRequestStatus() != ProjectRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Cannot update project request that is not pending");
        }

        // Validate dates
        if (dto.getContractEndDate().isBefore(dto.getContractStartDate())) {
            throw new RuntimeException("Contract end date must be after start date");
        }

        projectRequest.setProjectName(dto.getProjectName());
        projectRequest.setServiceType(dto.getServiceType());
        projectRequest.setContractStartDate(dto.getContractStartDate());
        projectRequest.setContractEndDate(dto.getContractEndDate());
        projectRequest.setContractManDays(dto.getContractManDays());
        projectRequest.setUpdatedAt(LocalDateTime.now());

        projectRequestMapper.update(projectRequest);
        return convertToDTO(projectRequest);
    }

    public ProjectRequestDTO approveProjectRequest(Long id, Long approvedByUserId, String approvalNotes) {
        ProjectRequest projectRequest = projectRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Project request not found with id: " + id));

        if (projectRequest.getRequestStatus() != ProjectRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Project request is not pending");
        }

        // Create the actual project
        Project project = new Project();
        project.setCompanyId(projectRequest.getCompanyId());
        project.setProjectName(projectRequest.getProjectName());
        project.setServiceType(projectRequest.getServiceType());
        project.setContractStartDate(projectRequest.getContractStartDate());
        project.setContractEndDate(projectRequest.getContractEndDate());
        project.setContractManDays(projectRequest.getContractManDays());
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());

        projectMapper.insert(project);

        // Update request status
        projectRequest.setRequestStatus(ProjectRequest.RequestStatus.APPROVED);
        projectRequest.setApprovedByUserId(approvedByUserId);
        projectRequest.setApprovalNotes(approvalNotes);
        projectRequest.setUpdatedAt(LocalDateTime.now());

        projectRequestMapper.updateStatus(projectRequest);
        return convertToDTO(projectRequest);
    }

    public ProjectRequestDTO rejectProjectRequest(Long id, Long approvedByUserId, String approvalNotes) {
        ProjectRequest projectRequest = projectRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Project request not found with id: " + id));

        if (projectRequest.getRequestStatus() != ProjectRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Project request is not pending");
        }

        projectRequest.setRequestStatus(ProjectRequest.RequestStatus.REJECTED);
        projectRequest.setApprovedByUserId(approvedByUserId);
        projectRequest.setApprovalNotes(approvalNotes);
        projectRequest.setUpdatedAt(LocalDateTime.now());

        projectRequestMapper.updateStatus(projectRequest);
        return convertToDTO(projectRequest);
    }

    public void deleteProjectRequest(Long id) {
        ProjectRequest projectRequest = projectRequestMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Project request not found with id: " + id));

        // Only allow deletion of pending or rejected requests
        if (projectRequest.getRequestStatus() == ProjectRequest.RequestStatus.APPROVED) {
            throw new RuntimeException("Cannot delete approved project request");
        }

        projectRequestMapper.deleteById(id);
    }

    private ProjectRequestDTO convertToDTO(ProjectRequest projectRequest) {
        ProjectRequestDTO dto = new ProjectRequestDTO();
        dto.setId(projectRequest.getId());
        dto.setRequestedByUserId(projectRequest.getRequestedByUserId());
        dto.setCompanyId(projectRequest.getCompanyId());
        dto.setProjectName(projectRequest.getProjectName());
        dto.setServiceType(projectRequest.getServiceType());
        dto.setContractStartDate(projectRequest.getContractStartDate());
        dto.setContractEndDate(projectRequest.getContractEndDate());
        dto.setContractManDays(projectRequest.getContractManDays());
        dto.setRequestStatus(projectRequest.getRequestStatus());
        dto.setApprovedByUserId(projectRequest.getApprovedByUserId());
        dto.setApprovalNotes(projectRequest.getApprovalNotes());
        dto.setCreatedAt(projectRequest.getCreatedAt());
        dto.setUpdatedAt(projectRequest.getUpdatedAt());

        // Load requested by user name
        userMapper.findById(projectRequest.getRequestedByUserId()).ifPresent(user ->
                dto.setRequestedByUsername(user.getUsername())
        );

        // Load company name
        companyMapper.findById(projectRequest.getCompanyId()).ifPresent(company ->
                dto.setCompanyName(company.getCompanyName())
        );

        // Load approved by user name
        if (projectRequest.getApprovedByUserId() != null) {
            userMapper.findById(projectRequest.getApprovedByUserId()).ifPresent(user ->
                    dto.setApprovedByUsername(user.getUsername())
            );
        }

        return dto;
    }

    private ProjectRequest convertToEntity(ProjectRequestDTO dto) {
        ProjectRequest projectRequest = new ProjectRequest();
        projectRequest.setProjectName(dto.getProjectName());
        projectRequest.setServiceType(dto.getServiceType());
        projectRequest.setContractStartDate(dto.getContractStartDate());
        projectRequest.setContractEndDate(dto.getContractEndDate());
        projectRequest.setContractManDays(dto.getContractManDays());
        return projectRequest;
    }
}
