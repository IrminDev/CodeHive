package com.github.codehive.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.github.codehive.websocket.CsvProgressWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    /**
     * Comma-separated list of allowed frontend origins, e.g.:
     * -Dcodehive.frontend.origins=http://localhost:3000,https://app.example.com
     */
    private static final String[] ALLOWED_ORIGINS =
            System.getProperty("codehive.frontend.origins", "http://localhost:3000")
                  .split("\\s*,\\s*");

    private final CsvProgressWebSocketHandler csvProgressHandler;

    public WebSocketConfig(CsvProgressWebSocketHandler csvProgressHandler) {
        this.csvProgressHandler = csvProgressHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(csvProgressHandler, "/ws/csv-progress")
                .setAllowedOrigins(ALLOWED_ORIGINS)
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request,
                                                   ServerHttpResponse response,
                                                   WebSocketHandler wsHandler,
                                                   java.util.Map<String, Object> attributes) {
                        // Require an authenticated principal for WebSocket connections.
                        return request.getPrincipal() != null;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request,
                                               ServerHttpResponse response,
                                               WebSocketHandler wsHandler,
                                               java.util.Map<String, Object> attributes) {
                        // No-op
                    }
                });
    }
}
