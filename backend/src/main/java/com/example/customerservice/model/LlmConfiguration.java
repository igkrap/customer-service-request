package com.example.customerservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LlmConfiguration {
    private Long id;
    private String apiEndpoint;
    private String modelName;
    private String embeddingModelName;
    private Integer embeddingDimension;
    private String apiKey;
    private Double temperature;
    private Integer maxTokens;
    private Double topP;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
