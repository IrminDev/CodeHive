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
    private static final long PENDING_TASK_TTL_MINUTES = 5;

    private final Map<String, WebSocketSession> taskSessions = new ConcurrentHashMap<>();
    private final Map<String, PendingTask> pendingTasks = new ConcurrentHashMap<>();
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
        PendingTask pendingTask = pendingTasks.get(taskId);
        if (pendingTask == null || !pendingTask.ownerId().equals(authenticatedUserId)) {
            try {
                session.close(CloseStatus.POLICY_VIOLATION);
            } catch (IOException exception) {
                logger.debug("Failed to close unauthorized CSV progress session", exception);
            }
            return;
        }
        session.getAttributes().put(TASK_ID_ATTRIBUTE, taskId);
        taskSessions.put(taskId, session);
        pendingTasks.remove(taskId, pendingTask);
        pendingTask.task().run();
    }

    public void queueTask(String taskId, UUID ownerId, Runnable task) {
        PendingTask pendingTask = new PendingTask(ownerId, task);
        pendingTasks.put(taskId, pendingTask);

        cleanupScheduler.schedule(
                () -> pendingTasks.remove(taskId, pendingTask),
                PENDING_TASK_TTL_MINUTES,
                TimeUnit.MINUTES);
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        String taskId = (String) session.getAttributes().get(TASK_ID_ATTRIBUTE);
        if (taskId != null) {
            taskSessions.remove(taskId);
            pendingTasks.remove(taskId);
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
        pendingTasks.remove(taskId);

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

    private record PendingTask(UUID ownerId, Runnable task) {}
}
