package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private String type;
    private Long requestId;
    private String title;
    private String status;
    private String message;
    private LocalDateTime createdAt;
}
