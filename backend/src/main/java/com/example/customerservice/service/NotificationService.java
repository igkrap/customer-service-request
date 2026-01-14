package com.example.customerservice.service;

import com.example.customerservice.dto.NotificationMessage;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.websocket.NotificationWebSocketHandler;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationWebSocketHandler webSocketHandler, ObjectMapper objectMapper) {
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
    }

    public void sendServiceRequestCreated(ServiceRequest serviceRequest, String recipientUserId) {
        String message = String.format("%s%s이 등록되었습니다.", formatProjectPrefix(serviceRequest), serviceRequest.getTitle());
        NotificationMessage payload = new NotificationMessage(
                "SERVICE_REQUEST_CREATED",
                serviceRequest.getId(),
                serviceRequest.getTitle(),
                serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null,
                message,
                LocalDateTime.now()
        );
        sendToUser(recipientUserId, payload);
    }

    public void sendServiceRequestStatusUpdated(ServiceRequest serviceRequest, String recipientUserId) {
        String status = serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null;
        String message;
        String type = "SERVICE_REQUEST_STATUS_UPDATED";
        if (serviceRequest.getStatus() == ServiceRequest.RequestStatus.RESOLVED) {
            message = String.format("%s%s이 처리되었습니다.", formatProjectPrefix(serviceRequest), serviceRequest.getTitle());
            type = "SERVICE_REQUEST_RESOLVED";
        } else {
            message = String.format("서비스 요청 상태가 변경되었습니다: %s (%s)", serviceRequest.getTitle(), status);
        }
        NotificationMessage payload = new NotificationMessage(
            type,
            serviceRequest.getId(),
            serviceRequest.getTitle(),
            status,
            message,
            LocalDateTime.now()
        );
        sendToUser(recipientUserId, payload);
    }

    public void sendManagerAssigned(ServiceRequest serviceRequest, String recipientUserId, String managerName) {
        String status = serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null;
        String message = String.format("%s%s이 접수되었습니다.", formatProjectPrefix(serviceRequest), serviceRequest.getTitle());
        NotificationMessage payload = new NotificationMessage(
            "MANAGER_ASSIGNED",
            serviceRequest.getId(),
            serviceRequest.getTitle(),
            status,
            message,
            LocalDateTime.now()
        );
        sendToUser(recipientUserId, payload);
    }

    public void sendAnnouncement(String recipientUserId, String title, String message) {
        String resolvedTitle = title == null || title.isBlank() ? "공지" : title;
        NotificationMessage payload = new NotificationMessage(
            "ANNOUNCEMENT",
            null,
            resolvedTitle,
            null,
            message,
            LocalDateTime.now()
        );
        sendToUser(recipientUserId, payload);
    }

    private void sendToUser(String recipientUserId, NotificationMessage payload) {
        if (recipientUserId == null || recipientUserId.isBlank()) {
            return;
        }
        try {
            webSocketHandler.sendToUser(recipientUserId, objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException ignored) {
        }
    }

    private String formatProjectPrefix(ServiceRequest serviceRequest) {
        if (serviceRequest == null) {
            return "";
        }
        String projectName = serviceRequest.getProjectName();
        if (projectName == null || projectName.isBlank()) {
            return "";
        }
        return String.format("[%s] ", projectName);
    }
}
