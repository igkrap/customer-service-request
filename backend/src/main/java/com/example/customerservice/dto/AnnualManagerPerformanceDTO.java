package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnualManagerPerformanceDTO {

    private Long id;
    private String managerName;
    private Integer totalRequests;
    private Integer resolvedRequests;
    private Double completionRate;
    private Double hoursSpent;
}
