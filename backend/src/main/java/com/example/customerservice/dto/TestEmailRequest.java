package com.example.customerservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestEmailRequest {
    @NotBlank(message = "To email is required")
    @Email(message = "To email should be valid")
    private String toEmail;
}
