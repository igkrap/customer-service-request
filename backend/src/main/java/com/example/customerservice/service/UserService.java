package com.example.customerservice.service;

import com.example.customerservice.dto.UserDTO;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public List<UserDTO> getAllUsers() {
        return userMapper.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToDTO(user);
    }

    public UserDTO updateUserRole(Long id, User.Role role) {
        User user = userMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setRole(role);
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.update(user);
        return convertToDTO(user);
    }

    public void deleteUser(Long id) {
        if (!userMapper.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userMapper.deleteById(id);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
