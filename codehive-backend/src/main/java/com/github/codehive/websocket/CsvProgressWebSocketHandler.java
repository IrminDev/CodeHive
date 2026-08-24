package com.github.codehive.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

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

import jakarta.annotation.PreDestroy;

@Component
public class CsvProgressWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(CsvProgressWebSocketHandler.class);

    private static final String TASK_ID_ATTRIBUTE = "taskId";
    private static final long TASK_OWNER_TTL_MINUTES = 10;

    private final Map<String, WebSocketSession> taskSessions = new ConcurrentHashMap<>();
    private final Map<String, UUID> taskOwners = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor();

    public CsvProgressWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) {
        String taskId = message.getPayload().trim();
        UUID authenticatedUserId = (UUID) session.getAttributes()
                .get(WebSocketTicketHandshakeInterceptor.USER_ID_ATTRIBUTE);
        UUID owner = isValidTaskId(taskId) ? taskOwners.get(taskId) : null;
        if (owner == null || !owner.equals(authenticatedUserId)) {
            try {
                session.close(CloseStatus.POLICY_VIOLATION);
            } catch (IOException exception) {
                logger.debug("Failed to close unauthorized CSV progress session", exception);
            }
            return;
        }
        // One subscription per session: drop the previous mapping so the map can't grow unbounded.
        String previous = (String) session.getAttributes().get(TASK_ID_ATTRIBUTE);
        if (previous != null && !previous.equals(taskId)) {
            taskSessions.remove(previous, session);
        }
        session.getAttributes().put(TASK_ID_ATTRIBUTE, taskId);
        taskSessions.put(taskId, session);
    }

    /**
     * Binds a task to the admin that submitted it, so only that admin can subscribe to its
     * progress. The import itself runs on the async executor and does not wait for a subscriber.
     */
    public void registerTask(String taskId, UUID ownerId) {
        taskOwners.put(taskId, ownerId);
        cleanupScheduler.schedule(
                () -> taskOwners.remove(taskId, ownerId),
                TASK_OWNER_TTL_MINUTES,
                TimeUnit.MINUTES);
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        String taskId = (String) session.getAttributes().get(TASK_ID_ATTRIBUTE);
        if (taskId != null) {
            taskSessions.remove(taskId, session);
        }
    }

    private static boolean isValidTaskId(String value) {
        if (value.length() != 36) {
            return false;
        }
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
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
        taskOwners.remove(taskId);
        WebSocketSession session = taskSessions.remove(taskId);
        if (session != null && session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
            } catch (IOException e) {
                logger.warn("Error closing WebSocket session for task {}", taskId, e);
            }
        }
    }

    @PreDestroy
    public void shutdownScheduler() {
        cleanupScheduler.shutdownNow();
    }
}
