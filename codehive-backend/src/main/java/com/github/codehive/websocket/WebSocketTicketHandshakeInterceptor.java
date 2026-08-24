package com.github.codehive.websocket;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class WebSocketTicketHandshakeInterceptor implements HandshakeInterceptor {
    public static final String USER_ID_ATTRIBUTE = "authenticatedUserId";
    private final WebSocketTicketService ticketService;

    public WebSocketTicketHandshakeInterceptor(WebSocketTicketService ticketService) {
        this.ticketService = ticketService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        MultiValueMap<String, String> parameters = UriComponentsBuilder.fromUri(request.getURI())
                .build().getQueryParams();
        return ticketService.consume(parameters.getFirst("ticket"))
                .map(userId -> {
                    attributes.put(USER_ID_ATTRIBUTE, userId);
                    return true;
                }).orElse(false);
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
