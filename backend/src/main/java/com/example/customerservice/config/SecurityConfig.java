package com.example.customerservice.config;

import com.example.customerservice.security.CustomUserDetailsService;
import com.example.customerservice.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.Customizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no authentication required
                        .requestMatchers("/api/auth/**").permitAll()

                        // Profile picture endpoint - public access
                        .requestMatchers("/api/users/profile-picture/*").permitAll()

                        // WebSocket notifications - public access
                        .requestMatchers("/ws/**").permitAll()

                        // User endpoints - require authentication
                        // Additional @PreAuthorize("hasRole('ADMIN')") on most endpoints in UserController
                        .requestMatchers("/api/users/**").authenticated()

                        // Service Request endpoints - require CUSTOMER, MANAGER, or ADMIN role
                        .requestMatchers("/api/service-requests/**").hasAnyRole("CUSTOMER", "MANAGER", "ADMIN")

                        // Attachment endpoints - require CUSTOMER, MANAGER, or ADMIN role
                        .requestMatchers("/api/attachments/**").hasAnyRole("CUSTOMER", "MANAGER", "ADMIN")

                        // Company endpoints - require authentication
                        // Additional @PreAuthorize("hasRole('ADMIN')") on CompanyController
                        .requestMatchers("/api/companies/**").authenticated()

                        // Project endpoints - require authentication
                        // Additional @PreAuthorize("hasRole('ADMIN')") on ProjectController
                        .requestMatchers("/api/projects/**").authenticated()

                        // Project Request endpoints - require authentication
                        .requestMatchers("/api/project-requests/**").authenticated()

                        // Email settings endpoints - require authentication
                        // Additional @PreAuthorize("hasRole('ADMIN')") on EmailSettingsController
                        .requestMatchers("/api/email-settings/**").authenticated()

                        // Email templates endpoints - require authentication
                        // Additional @PreAuthorize("hasRole('ADMIN')") on EmailTemplateController
                        .requestMatchers("/api/email-templates/**").authenticated()

                        // Report endpoints - require ADMIN role
                        .requestMatchers("/api/reports/**").hasRole("ADMIN")

                        // All other requests need authentication
                        .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
