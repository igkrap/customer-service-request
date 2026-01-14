package com.example.customerservice.config;

import com.example.customerservice.websocket.NotificationWebSocketHandler;
import com.example.customerservice.websocket.WebSocketAuthInterceptor;
import com.example.customerservice.security.CustomUserDetailsService;
import com.example.customerservice.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler(), "/ws/notifications")
                .addInterceptors(webSocketAuthInterceptor())
                .setAllowedOriginPatterns("*");
    }

    @Bean
    public NotificationWebSocketHandler notificationWebSocketHandler() {
        return new NotificationWebSocketHandler();
    }

    @Bean
    public WebSocketAuthInterceptor webSocketAuthInterceptor() {
        return new WebSocketAuthInterceptor(jwtUtil, userDetailsService);
    }
}
