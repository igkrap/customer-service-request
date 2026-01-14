package com.example.customerservice.dto;

import lombok.Data;

@Data
public class NotificationAnnouncementRequest {
    private String recipientUserId;
    private String title;
    private String message;
}
