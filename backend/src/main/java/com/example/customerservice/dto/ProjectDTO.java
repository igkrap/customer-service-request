package com.example.customerservice.dto;

import com.example.customerservice.model.Project;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {
    private Long id;
    private Long companyId;
    private String companyName;
    private String projectName;
    private Project.ServiceType serviceType;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private BigDecimal contractManDays;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
