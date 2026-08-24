package com.github.codehive.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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

    private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-0000000000aa");

    private CsvProgressWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new CsvProgressWebSocketHandler(new ObjectMapper());
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

    private String registeredTask() {
        String taskId = UUID.randomUUID().toString();
        handler.registerTask(taskId, OWNER);
        return taskId;
    }

    @Test
    @DisplayName("ignores a payload that is not a valid task id")
    void malformedPayload_isNotRegistered() {
        WebSocketSession session = sessionOwnedBy(OWNER);

        handler.handleTextMessage(session, new TextMessage("not-a-uuid"));

        assertThat(taskSessions()).isEmpty();
        assertThat(session.getAttributes()).doesNotContainKey("taskId");
    }

    @Test
    @DisplayName("registers a session for a valid task id")
    void validPayload_isRegistered() {
        WebSocketSession session = sessionOwnedBy(OWNER);
        String taskId = registeredTask();

        handler.handleTextMessage(session, new TextMessage(taskId));

        assertThat(taskSessions()).containsEntry(taskId, session);
    }

    @Test
    @DisplayName("rejects a subscriber that does not own the task")
    void foreignSubscriber_isRejected() {
        WebSocketSession session = sessionOwnedBy(UUID.randomUUID());
        String taskId = registeredTask();

        handler.handleTextMessage(session, new TextMessage(taskId));

        assertThat(taskSessions()).isEmpty();
    }

    @Test
    @DisplayName("rejects a task id that was never registered")
    void unknownTask_isRejected() {
        WebSocketSession session = sessionOwnedBy(OWNER);

        handler.handleTextMessage(session, new TextMessage(UUID.randomUUID().toString()));

        assertThat(taskSessions()).isEmpty();
    }

    @Test
    @DisplayName("keeps at most one subscription per session")
    void secondSubscription_replacesTheFirst() {
        WebSocketSession session = sessionOwnedBy(OWNER);
        String first = registeredTask();
        String second = registeredTask();

        handler.handleTextMessage(session, new TextMessage(first));
        handler.handleTextMessage(session, new TextMessage(second));

        assertThat(taskSessions()).hasSize(1);
        assertThat(taskSessions()).containsOnlyKeys(second);
    }

    @Test
    @DisplayName("removes the subscription when the connection closes")
    void closingConnection_removesSubscription() {
        WebSocketSession session = sessionOwnedBy(OWNER);
        String taskId = registeredTask();
        handler.handleTextMessage(session, new TextMessage(taskId));
        assertThat(taskSessions()).isNotEmpty();

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        assertThat(taskSessions()).isEmpty();
    }
}
