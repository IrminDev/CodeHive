package com.github.codehive.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.model.response.auth.CsvProgressMessage;

@Component
public class CsvProgressWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(CsvProgressWebSocketHandler.class);

    private final Map<String, WebSocketSession> taskSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public CsvProgressWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        logger.debug("WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String taskId = message.getPayload().trim();
        taskSessions.put(taskId, session);
        logger.debug("Client subscribed to task: {}", taskId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        taskSessions.values().removeIf(s -> s.getId().equals(session.getId()));
        logger.debug("WebSocket connection closed: {}", session.getId());
    }

    public void sendProgress(String taskId, CsvProgressMessage progress) {
        WebSocketSession session = taskSessions.get(taskId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(progress);
                session.sendMessage(new TextMessage(json));
            } catch (IOException e) {
                logger.error("Error sending progress for task {}", taskId, e);
            }
        }
    }

    public void completeTask(String taskId) {
        taskSessions.remove(taskId);
    }
}
