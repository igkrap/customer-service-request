package com.example.customerservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailSettingsDTO {
    private Long id;

    @NotBlank(message = "SMTP host is required")
    private String smtpHost;

    @NotNull(message = "SMTP port is required")
    private Integer smtpPort;

    @NotBlank(message = "SMTP username is required")
    private String smtpUsername;

    @NotBlank(message = "SMTP password is required")
    private String smtpPassword;

    @NotBlank(message = "From email is required")
    @Email(message = "From email should be valid")
    private String fromEmail;

    private String fromName;

    @NotNull(message = "Use TLS flag is required")
    private Boolean useTls;

    @NotNull(message = "Use SSL flag is required")
    private Boolean useSsl;

    @NotNull(message = "Enabled flag is required")
    private Boolean enabled;
}
