package com.example.customerservice.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    private Long id;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Company code is required")
    private String companyCode;

    @NotBlank(message = "Business number is required")
    private String businessNumber;

    private String licenseKey;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
