package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyPerformanceMonthlyDTO {

    private Long projectId;
    private String companyName;
    private String projectName;
    private String yearMonth;
    private Double plannedManDays;
    private Double actualManDays;
    private Double achievementRate;
}
