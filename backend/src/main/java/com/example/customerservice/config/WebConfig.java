package com.example.customerservice.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;
    private final String[] allowedMethods;
    private final String[] allowedHeaders;
    private final boolean allowCredentials;

    public WebConfig(
            @Value("${spring.web.cors.allowed-origins:}") String allowedOrigins,
            @Value("${spring.web.cors.allowed-methods:}") String allowedMethods,
            @Value("${spring.web.cors.allowed-headers:}") String allowedHeaders,
            @Value("${spring.web.cors.allow-credentials:false}") boolean allowCredentials) {
        this.allowedOrigins = splitAndTrim(allowedOrigins);
        this.allowedMethods = splitAndTrim(allowedMethods);
        this.allowedHeaders = splitAndTrim(allowedHeaders);
        this.allowCredentials = allowCredentials;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        CorsRegistration registration = registry.addMapping("/**");
        registration.allowedOrigins(resolveAllowedOrigins());
        registration.allowedMethods(resolveAllowedMethods());
        registration.allowedHeaders(resolveAllowedHeaders());
        registration.allowCredentials(allowCredentials);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(resolveAllowedOrigins()));
        configuration.setAllowedMethods(Arrays.asList(resolveAllowedMethods()));
        configuration.setAllowedHeaders(Arrays.asList(resolveAllowedHeaders()));
        configuration.setAllowCredentials(allowCredentials);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private String[] resolveAllowedOrigins() {
        return allowedOrigins.length > 0 ? allowedOrigins : new String[] { "http://localhost:3000" };
    }

    private String[] resolveAllowedMethods() {
        return allowedMethods.length > 0
                ? allowedMethods
                : new String[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" };
    }

    private String[] resolveAllowedHeaders() {
        return allowedHeaders.length > 0 ? allowedHeaders : new String[] { "*" };
    }

    private static String[] splitAndTrim(String value) {
        if (value == null || value.isBlank()) {
            return new String[0];
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(entry -> !entry.isEmpty())
                .toArray(String[]::new);
    }
}
