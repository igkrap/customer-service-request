package com.example.customerservice.service;

import com.example.customerservice.dto.ProjectDTO;
import com.example.customerservice.mapper.CompanyMapper;
import com.example.customerservice.mapper.ProjectMapper;
import com.example.customerservice.model.Company;
import com.example.customerservice.model.Project;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectService {

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private CompanyMapper companyMapper;

    public List<ProjectDTO> getAllProjects() {
        return projectMapper.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProjectDTO getProjectById(Long id) {
        Project project = projectMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
        return convertToDTO(project);
    }

    public List<ProjectDTO> getProjectsByCompanyId(Long companyId) {
        return projectMapper.findByCompanyId(companyId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProjectDTO createProject(ProjectDTO dto) {
        // Validate company exists
        Company company = companyMapper.findById(dto.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + dto.getCompanyId()));

        // Validate dates
        if (dto.getContractEndDate().isBefore(dto.getContractStartDate())) {
            throw new RuntimeException("Contract end date must be after start date");
        }

        Project project = convertToEntity(dto);
        project.setLicenseKey(LicenseKeyGenerator.generate());
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());

        projectMapper.insert(project);
        return convertToDTO(project);
    }

    public ProjectDTO updateProject(Long id, ProjectDTO dto) {
        Project project = projectMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        // Validate company exists if being changed
        if (!project.getCompanyId().equals(dto.getCompanyId())) {
            companyMapper.findById(dto.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Company not found with id: " + dto.getCompanyId()));
        }

        // Validate dates
        if (dto.getContractEndDate().isBefore(dto.getContractStartDate())) {
            throw new RuntimeException("Contract end date must be after start date");
        }

        project.setCompanyId(dto.getCompanyId());
        project.setProjectName(dto.getProjectName());
        project.setServiceType(dto.getServiceType());
        project.setContractStartDate(dto.getContractStartDate());
        project.setContractEndDate(dto.getContractEndDate());
        project.setContractManDays(dto.getContractManDays());
        project.setUpdatedAt(LocalDateTime.now());

        projectMapper.update(project);
        return convertToDTO(project);
    }

    public void deleteProject(Long id) {
        if (!projectMapper.existsById(id)) {
            throw new RuntimeException("Project not found with id: " + id);
        }
        projectMapper.deleteById(id);
    }

    private ProjectDTO convertToDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setCompanyId(project.getCompanyId());
        dto.setProjectName(project.getProjectName());
        dto.setServiceType(project.getServiceType());
        dto.setContractStartDate(project.getContractStartDate());
        dto.setContractEndDate(project.getContractEndDate());
        dto.setContractManDays(project.getContractManDays());
        dto.setLicenseKey(project.getLicenseKey());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());

        // Load company name
        companyMapper.findById(project.getCompanyId()).ifPresent(company ->
                dto.setCompanyName(company.getCompanyName())
        );

        return dto;
    }

    private Project convertToEntity(ProjectDTO dto) {
        Project project = new Project();
        project.setCompanyId(dto.getCompanyId());
        project.setProjectName(dto.getProjectName());
        project.setServiceType(dto.getServiceType());
        project.setContractStartDate(dto.getContractStartDate());
        project.setContractEndDate(dto.getContractEndDate());
        project.setContractManDays(dto.getContractManDays());
        project.setLicenseKey(dto.getLicenseKey());
        return project;
    }

}
