package com.github.codehive.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;

@DisplayName("CsvProgressWebSocketHandler subscription state")
class CsvProgressWebSocketHandlerTest {

    private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000000002");

    private CsvProgressWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new CsvProgressWebSocketHandler(new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        handler.shutdownScheduler();
    }

    @SuppressWarnings("unchecked")
    private Map<String, WebSocketSession> taskSessions() {
        return (Map<String, WebSocketSession>) ReflectionTestUtils.getField(handler, "taskSessions");
    }

    private WebSocketSession sessionOwnedBy(UUID userId) {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attributes = new HashMap<>();
        attributes.put(WebSocketTicketHandshakeInterceptor.USER_ID_ATTRIBUTE, userId);
        when(session.getAttributes()).thenReturn(attributes);
        return session;
    }

    @Test
    @DisplayName("rejects a task id that was never queued")
    void unqueuedTaskId_isRejected() throws Exception {
        WebSocketSession session = sessionOwnedBy(OWNER);

        handler.handleTextMessage(session, new TextMessage(UUID.randomUUID().toString()));

        assertThat(taskSessions()).isEmpty();
        verify(session).close(CloseStatus.POLICY_VIOLATION);
    }

    @Test
    @DisplayName("rejects a subscriber that does not own the task")
    void ownerMismatch_isRejected() throws Exception {
        String taskId = UUID.randomUUID().toString();
        AtomicBoolean ran = new AtomicBoolean(false);
        handler.queueTask(taskId, OWNER, () -> ran.set(true));
        WebSocketSession intruder = sessionOwnedBy(OTHER);

        handler.handleTextMessage(intruder, new TextMessage(taskId));

        assertThat(taskSessions()).isEmpty();
        assertThat(ran).isFalse();
        verify(intruder).close(CloseStatus.POLICY_VIOLATION);
    }

    @Test
    @DisplayName("registers the owner and runs the queued task")
    void owner_subscribesAndStartsTask() throws Exception {
        String taskId = UUID.randomUUID().toString();
        AtomicBoolean ran = new AtomicBoolean(false);
        handler.queueTask(taskId, OWNER, () -> ran.set(true));
        WebSocketSession session = sessionOwnedBy(OWNER);

        handler.handleTextMessage(session, new TextMessage(taskId));

        assertThat(taskSessions()).containsEntry(taskId, session);
        assertThat(ran).isTrue();
        verify(session, never()).close(CloseStatus.POLICY_VIOLATION);
    }

    @Test
    @DisplayName("removes the subscription when the connection closes")
    void closingConnection_removesSubscription() throws Exception {
        String taskId = UUID.randomUUID().toString();
        handler.queueTask(taskId, OWNER, () -> { });
        WebSocketSession session = sessionOwnedBy(OWNER);
        handler.handleTextMessage(session, new TextMessage(taskId));

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        assertThat(taskSessions()).isEmpty();
    }
}
