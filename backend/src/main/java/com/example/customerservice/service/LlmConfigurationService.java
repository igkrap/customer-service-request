package com.example.customerservice.service;

import com.example.customerservice.dto.LlmConfigurationDTO;
import com.example.customerservice.mapper.LlmConfigurationMapper;
import com.example.customerservice.model.LlmConfiguration;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LlmConfigurationService {

    private final LlmConfigurationMapper llmConfigurationMapper;

    @Transactional
    public LlmConfiguration createLlmConfiguration(LlmConfigurationDTO dto) {
        LlmConfiguration config = new LlmConfiguration();
        config.setApiEndpoint(dto.getApiEndpoint());
        config.setModelName(dto.getModelName());
        config.setEmbeddingModelName(dto.getEmbeddingModelName());
        config.setEmbeddingDimension(dto.getEmbeddingDimension() != null ? dto.getEmbeddingDimension() : 1536);
        config.setApiKey(dto.getApiKey());
        config.setTemperature(dto.getTemperature() != null ? dto.getTemperature() : 0.7);
        config.setMaxTokens(dto.getMaxTokens() != null ? dto.getMaxTokens() : 2000);
        config.setTopP(dto.getTopP() != null ? dto.getTopP() : 0.9);
        config.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);

        llmConfigurationMapper.insertLlmConfiguration(config);
        return config;
    }

    public LlmConfiguration getLlmConfigurationById(Long id) {
        return llmConfigurationMapper.getLlmConfigurationById(id);
    }

    public LlmConfiguration getActiveLlmConfiguration() {
        return llmConfigurationMapper.getActiveLlmConfiguration();
    }

    public List<LlmConfiguration> getAllLlmConfigurations() {
        return llmConfigurationMapper.getAllLlmConfigurations();
    }

    @Transactional
    public LlmConfiguration updateLlmConfiguration(Long id, LlmConfigurationDTO dto) {
        LlmConfiguration config = llmConfigurationMapper.getLlmConfigurationById(id);
        if (config == null) {
            throw new RuntimeException("LLM configuration not found with id: " + id);
        }

        config.setApiEndpoint(dto.getApiEndpoint());
        config.setModelName(dto.getModelName());
        config.setEmbeddingModelName(dto.getEmbeddingModelName());
        config.setEmbeddingDimension(dto.getEmbeddingDimension());
        config.setApiKey(dto.getApiKey());
        config.setTemperature(dto.getTemperature());
        config.setMaxTokens(dto.getMaxTokens());
        config.setTopP(dto.getTopP());
        config.setEnabled(dto.getEnabled());

        llmConfigurationMapper.updateLlmConfiguration(config);
        return config;
    }

    @Transactional
    public void deleteLlmConfiguration(Long id) {
        llmConfigurationMapper.deleteLlmConfiguration(id);
    }
}
