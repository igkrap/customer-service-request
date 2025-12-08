package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LlmConfigurationDTO {
    private String apiEndpoint;
    private String modelName;
    private String embeddingModelName;
    private Integer embeddingDimension;
    private String apiKey;
    private Double temperature;
    private Integer maxTokens;
    private Double topP;
    private Boolean enabled;
}
