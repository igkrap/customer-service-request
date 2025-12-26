package com.example.customerservice.service;

import com.example.customerservice.dto.CompanyDTO;
import com.example.customerservice.mapper.CompanyMapper;
import com.example.customerservice.model.Company;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompanyService {

    @Autowired
    private CompanyMapper companyMapper;

    public List<CompanyDTO> getAllCompanies() {
        return companyMapper.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CompanyDTO getCompanyById(Long id) {
        Company company = companyMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        return convertToDTO(company);
    }

    public CompanyDTO createCompany(CompanyDTO dto) {
        // Check if company code already exists
        if (companyMapper.findByCompanyCode(dto.getCompanyCode()).isPresent()) {
            throw new RuntimeException("Company code already exists: " + dto.getCompanyCode());
        }

        Company company = convertToEntity(dto);
        company.setLicenseKey(generateLicenseKey());
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());

        companyMapper.insert(company);
        return convertToDTO(company);
    }

    public CompanyDTO updateCompany(Long id, CompanyDTO dto) {
        Company company = companyMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));

        // Check if company code is being changed and if it already exists
        if (!company.getCompanyCode().equals(dto.getCompanyCode())) {
            if (companyMapper.findByCompanyCode(dto.getCompanyCode()).isPresent()) {
                throw new RuntimeException("Company code already exists: " + dto.getCompanyCode());
            }
        }

        company.setCompanyName(dto.getCompanyName());
        company.setCompanyCode(dto.getCompanyCode());
        company.setBusinessNumber(dto.getBusinessNumber());
        company.setUpdatedAt(LocalDateTime.now());

        companyMapper.update(company);
        return convertToDTO(company);
    }

    public void deleteCompany(Long id) {
        if (!companyMapper.existsById(id)) {
            throw new RuntimeException("Company not found with id: " + id);
        }
        companyMapper.deleteById(id);
    }

    private CompanyDTO convertToDTO(Company company) {
        CompanyDTO dto = new CompanyDTO();
        dto.setId(company.getId());
        dto.setCompanyName(company.getCompanyName());
        dto.setCompanyCode(company.getCompanyCode());
        dto.setBusinessNumber(company.getBusinessNumber());
        dto.setLicenseKey(company.getLicenseKey());
        dto.setCreatedAt(company.getCreatedAt());
        dto.setUpdatedAt(company.getUpdatedAt());
        return dto;
    }

    private Company convertToEntity(CompanyDTO dto) {
        Company company = new Company();
        company.setCompanyName(dto.getCompanyName());
        company.setCompanyCode(dto.getCompanyCode());
        company.setBusinessNumber(dto.getBusinessNumber());
        company.setLicenseKey(dto.getLicenseKey());
        return company;
    }

    private String generateLicenseKey() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        StringBuilder builder = new StringBuilder("PX");
        for (int i = 0; i < timestamp.length(); i++) {
            int position = i + 1;
            int digit = Character.digit(timestamp.charAt(i), 10);
            boolean shouldConvert = (position % 2 == 0 && digit % 2 == 0) || (position % 2 == 1 && digit % 2 == 1);
            if (shouldConvert) {
                builder.append((char) ('A' + digit));
            } else {
                builder.append(digit);
            }
        }
        return builder.toString();
    }
}
