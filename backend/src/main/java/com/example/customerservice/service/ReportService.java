package com.example.customerservice.service;

import com.example.customerservice.dto.AnnualManagerPerformanceDTO;
import com.example.customerservice.dto.CompanyPerformanceDTO;
import com.example.customerservice.mapper.ReportMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportMapper reportMapper;

    public List<CompanyPerformanceDTO> getCompanyPerformance(Long companyId) {
        return reportMapper.findCompanyPerformance(companyId);
    }

    public List<AnnualManagerPerformanceDTO> getAnnualManagerPerformance(int year) {
        return reportMapper.findAnnualManagerPerformance(year);
    }
}
