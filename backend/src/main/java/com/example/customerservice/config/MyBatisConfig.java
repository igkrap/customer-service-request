package com.example.customerservice.config;

import org.mybatis.spring.boot.autoconfigure.ConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis configuration for custom TypeHandlers
 */
@Configuration
public class MyBatisConfig {

    /**
     * Register VectorTypeHandler for PostgreSQL vector type support
     * Uses ConfigurationCustomizer to add to Spring Boot's auto-configuration
     * instead of replacing it
     */
    @Bean
    public ConfigurationCustomizer mybatisConfigurationCustomizer() {
        return configuration -> {
            // Register TypeHandler for float[] <-> PostgreSQL vector conversion
            configuration.getTypeHandlerRegistry().register(float[].class, VectorTypeHandler.class);
        };
    }
}
