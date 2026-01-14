package com.example.customerservice.websocket;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, Set<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = getUserId(session);
        if (userId == null) {
            closeSession(session);
            return;
        }
        sessionsByUserId
                .computeIfAbsent(userId, key -> new CopyOnWriteArraySet<>())
                .add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userId = getUserId(session);
        if (userId == null) {
            return;
        }
        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                sessionsByUserId.remove(userId);
            }
        }
    }

    public void sendToUser(String userId, String payload) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }
        TextMessage message = new TextMessage(payload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException ignored) {
                    sessions.remove(session);
                }
            }
        }
    }

    private String getUserId(WebSocketSession session) {
        Object userId = session.getAttributes().get("userId");
        return userId instanceof String ? (String) userId : null;
    }

    private void closeSession(WebSocketSession session) {
        try {
            session.close(CloseStatus.NOT_ACCEPTABLE);
        } catch (IOException ignored) {
        }
    }
}
