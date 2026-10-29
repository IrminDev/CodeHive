package com.github.codehive.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.github.codehive.websocket.CsvProgressWebSocketHandler;
import com.github.codehive.websocket.WebSocketTicketHandshakeInterceptor;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Value("${frontend.url:http://localhost:5173}")
    private String allowedOrigins;

    private final CsvProgressWebSocketHandler csvProgressHandler;
    private final WebSocketTicketHandshakeInterceptor ticketInterceptor;

    public WebSocketConfig(CsvProgressWebSocketHandler csvProgressHandler,
                           WebSocketTicketHandshakeInterceptor ticketInterceptor) {
        this.csvProgressHandler = csvProgressHandler;
        this.ticketInterceptor = ticketInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(csvProgressHandler, "/ws/csv-progress")
                .addInterceptors(ticketInterceptor)
                .setAllowedOrigins(allowedOrigins.split("\\s*,\\s*"));
    }
}
