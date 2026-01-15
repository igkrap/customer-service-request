package com.example.customerservice.controller;

import com.example.customerservice.dto.AnnualManagerPerformanceDTO;
import com.example.customerservice.dto.CompanyPerformanceDTO;
import com.example.customerservice.dto.CompanyPerformanceMonthlyDTO;
import com.example.customerservice.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/company-performance")
    public List<CompanyPerformanceDTO> getCompanyPerformance(
            @RequestParam(required = false) Long companyId
    ) {
        return reportService.getCompanyPerformance(companyId);
    }

    @GetMapping("/company-performance-monthly")
    public List<CompanyPerformanceMonthlyDTO> getCompanyPerformanceMonthly(
            @RequestParam Long projectId
    ) {
        return reportService.getCompanyPerformanceMonthly(projectId);
    }

    @GetMapping("/annual-manager-performance")
    public List<AnnualManagerPerformanceDTO> getAnnualManagerPerformance(
            @RequestParam int year
    ) {
        return reportService.getAnnualManagerPerformance(year);
    }
}
