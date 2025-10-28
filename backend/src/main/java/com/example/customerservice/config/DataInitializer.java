package com.example.customerservice.config;

import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Data initialization removed - users should be created through signup
        if (!userMapper.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode("1234"));
            admin.setRole(User.Role.ROLE_ADMIN);
            admin.setApprovalStatus(User.ApprovalStatus.APPROVED);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userMapper.insert(admin);
            System.out.println("Admin user created: admin / 1234");
        }

        // Check if manager user already exists
        if (!userMapper.existsByUsername("manager")) {
            User manager = new User();
            manager.setUsername("manager");
            manager.setEmail("manager@example.com");
            manager.setPassword(passwordEncoder.encode("1234"));
            manager.setRole(User.Role.ROLE_MANAGER);
            manager.setApprovalStatus(User.ApprovalStatus.APPROVED);
            manager.setCreatedAt(LocalDateTime.now());
            manager.setUpdatedAt(LocalDateTime.now());
            userMapper.insert(manager);
            System.out.println("Manager user created: manager / 1234");
        }

        // Check if customer user already exists
        if (!userMapper.existsByUsername("customer")) {
            User customer = new User();
            customer.setUsername("customer");
            customer.setEmail("customer@example.com");
            customer.setPassword(passwordEncoder.encode("1234"));
            customer.setRole(User.Role.ROLE_CUSTOMER);
            customer.setApprovalStatus(User.ApprovalStatus.APPROVED);
            customer.setCreatedAt(LocalDateTime.now());
            customer.setUpdatedAt(LocalDateTime.now());
            userMapper.insert(customer);
            System.out.println("Customer user created: customer / 1234");
        }
    }
}
