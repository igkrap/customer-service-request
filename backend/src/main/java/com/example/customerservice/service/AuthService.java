package com.example.customerservice.service;

import com.example.customerservice.dto.AuthResponse;
import com.example.customerservice.dto.LoginRequest;
import com.example.customerservice.dto.SignupRequest;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.User;
import com.example.customerservice.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    public AuthResponse signup(SignupRequest request) {
        // Check if username already exists
        if (userMapper.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken");
        }

        // Check if email already exists
        if (userMapper.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        // Create new user with PENDING approval status
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.ROLE_CUSTOMER);
        user.setApprovalStatus(User.ApprovalStatus.PENDING); // Set to PENDING for admin approval
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);

        // Return response without token - user needs approval first
        return new AuthResponse(null, user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        // Get user details first to check approval status
        User user = userMapper.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check approval status
        if (user.getApprovalStatus() == User.ApprovalStatus.PENDING) {
            throw new RuntimeException("관리자의 승인이 필요합니다.");
        }
        if (user.getApprovalStatus() == User.ApprovalStatus.REJECTED) {
            throw new RuntimeException("계정이 거부되었습니다. 관리자에게 문의하세요.");
        }

        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Generate JWT token
        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());
    }
}
