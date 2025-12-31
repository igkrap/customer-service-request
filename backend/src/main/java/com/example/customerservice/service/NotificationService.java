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

    public void sendServiceRequestCreated(ServiceRequest serviceRequest) {
        String message = String.format("새 서비스 요청이 등록되었습니다: %s", serviceRequest.getTitle());
        NotificationMessage payload = new NotificationMessage(
                "SERVICE_REQUEST_CREATED",
                serviceRequest.getId(),
                serviceRequest.getTitle(),
                serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null,
                message,
                LocalDateTime.now()
        );
        broadcast(payload);
    }

    public void sendServiceRequestStatusUpdated(ServiceRequest serviceRequest) {
        String status = serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null;
        String message = String.format("서비스 요청 상태가 변경되었습니다: %s (%s)", serviceRequest.getTitle(), status);
        NotificationMessage payload = new NotificationMessage(
            "SERVICE_REQUEST_STATUS_UPDATED",
            serviceRequest.getId(),
            serviceRequest.getTitle(),
            status,
            message,
            LocalDateTime.now()
        );
        broadcast(payload);
    }

    public void sendManagerAssigned(ServiceRequest serviceRequest, String managerName) {
        String status = serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null;
        String message = String.format("담당자가 배정되었습니다: %s (%s)", serviceRequest.getTitle(), managerName);
        NotificationMessage payload = new NotificationMessage(
            "MANAGER_ASSIGNED",
            serviceRequest.getId(),
            serviceRequest.getTitle(),
            status,
            message,
            LocalDateTime.now()
        );
        broadcast(payload);
    }

    private void broadcast(NotificationMessage payload) {
        try {
            webSocketHandler.broadcast(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException ignored) {
        }
    }
}
