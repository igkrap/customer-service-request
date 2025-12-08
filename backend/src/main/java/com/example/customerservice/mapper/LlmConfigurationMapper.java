package com.example.customerservice.mapper;

import com.example.customerservice.model.LlmConfiguration;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface LlmConfigurationMapper {

    @Insert("INSERT INTO llm_configurations (api_endpoint, model_name, api_key, temperature, max_tokens, top_p, enabled, created_at, updated_at) " +
            "VALUES (#{apiEndpoint}, #{modelName}, #{apiKey}, #{temperature}, #{maxTokens}, #{topP}, #{enabled}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insertLlmConfiguration(LlmConfiguration llmConfiguration);

    @Select("SELECT * FROM llm_configurations WHERE id = #{id}")
    LlmConfiguration getLlmConfigurationById(Long id);

    @Select("SELECT * FROM llm_configurations WHERE enabled = true ORDER BY id DESC LIMIT 1")
    LlmConfiguration getActiveLlmConfiguration();

    @Select("SELECT * FROM llm_configurations ORDER BY created_at DESC")
    List<LlmConfiguration> getAllLlmConfigurations();

    @Update("UPDATE llm_configurations SET " +
            "api_endpoint = #{apiEndpoint}, " +
            "model_name = #{modelName}, " +
            "api_key = #{apiKey}, " +
            "temperature = #{temperature}, " +
            "max_tokens = #{maxTokens}, " +
            "top_p = #{topP}, " +
            "enabled = #{enabled}, " +
            "updated_at = CURRENT_TIMESTAMP " +
            "WHERE id = #{id}")
    void updateLlmConfiguration(LlmConfiguration llmConfiguration);

    @Delete("DELETE FROM llm_configurations WHERE id = #{id}")
    void deleteLlmConfiguration(Long id);
}
