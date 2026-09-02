package com.github.codehive.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.github.codehive.websocket.CsvProgressWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Value("${frontend.url:http://localhost:5173}")
    private String allowedOrigins;

    private final CsvProgressWebSocketHandler csvProgressHandler;

    public WebSocketConfig(CsvProgressWebSocketHandler csvProgressHandler) {
        this.csvProgressHandler = csvProgressHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(csvProgressHandler, "/ws/csv-progress")
                .setAllowedOrigins(allowedOrigins.split("\\s*,\\s*"));
    }
}
