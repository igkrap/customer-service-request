package com.example.customerservice.controller;

import com.example.customerservice.dto.NotificationAnnouncementRequest;
import com.example.customerservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public void sendAnnouncement(@RequestBody NotificationAnnouncementRequest request) {
        if (request == null || request.getRecipientUserId() == null || request.getRecipientUserId().isBlank()) {
            throw new IllegalArgumentException("recipientUserId is required");
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("message is required");
        }
        notificationService.sendAnnouncement(request.getRecipientUserId(), request.getTitle(), request.getMessage());
    }
}
