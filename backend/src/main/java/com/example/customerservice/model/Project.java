package com.example.customerservice.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    private Long id;

    @NotNull(message = "Company is required")
    private Long companyId;

    @NotBlank(message = "Project name is required")
    private String projectName;

    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    @NotNull(message = "Contract start date is required")
    private LocalDate contractStartDate;

    @NotNull(message = "Contract end date is required")
    private LocalDate contractEndDate;

    @NotNull(message = "Contract man-days is required")
    private BigDecimal contractManDays;

    private String licenseKey;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum ServiceType {
        NEW,                // 신규
        MAINTENANCE,        // 유지보수
        DEFECT_REPAIR,      // 하자보수
        ETC                 // 기타
    }
}
