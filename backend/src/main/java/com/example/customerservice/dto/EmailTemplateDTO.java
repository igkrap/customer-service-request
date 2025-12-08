package com.example.customerservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateDTO {
    private Long id;

    @NotBlank(message = "Template code is required")
    private String templateCode;

    @NotBlank(message = "Template name is required")
    private String templateName;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Body is required")
    private String body;

    private String description;
    private String variables;

    @NotNull(message = "Enabled flag is required")
    private Boolean enabled;
}
