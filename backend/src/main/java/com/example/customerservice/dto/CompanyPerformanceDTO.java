package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyPerformanceDTO {

    private Long id;
    private Long companyId;
    private String companyName;
    private String projectName;
    private Double plannedManDays;
    private Double actualManDays;
    private Integer totalRequests;
    private Integer resolvedRequests;
    private Double achievementRate;
    private Double completionRate;
}
