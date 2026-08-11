package com.github.codehive.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
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

    private static final String TASK_ID_ATTRIBUTE = "taskId";

    private final Map<String, WebSocketSession> taskSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public CsvProgressWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) {
        String taskId = message.getPayload().trim();
        session.getAttributes().put(TASK_ID_ATTRIBUTE, taskId);
        taskSessions.put(taskId, session);
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        String taskId = (String) session.getAttributes().get(TASK_ID_ATTRIBUTE);
        if (taskId != null) {
            taskSessions.remove(taskId);
        }
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
        WebSocketSession session = taskSessions.remove(taskId);
        if (session != null && session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
            } catch (IOException e) {
                logger.warn("Error closing WebSocket session for task {}", taskId, e);
            }
        }
    }
}
