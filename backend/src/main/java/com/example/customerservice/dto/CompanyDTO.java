package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDTO {
    private Long id;
    private String companyName;
    private String companyCode;
    private String businessNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
