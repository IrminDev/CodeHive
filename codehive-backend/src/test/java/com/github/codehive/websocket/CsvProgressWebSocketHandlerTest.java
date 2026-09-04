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

    private CsvProgressWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new CsvProgressWebSocketHandler(new ObjectMapper());
    }

    @SuppressWarnings("unchecked")
    private Map<String, WebSocketSession> taskSessions() {
        return (Map<String, WebSocketSession>) ReflectionTestUtils.getField(handler, "taskSessions");
    }

    private WebSocketSession sessionWithAttributes() {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getAttributes()).thenReturn(new HashMap<>());
        return session;
    }

    @Test
    @DisplayName("ignores a payload that is not a valid task id")
    void malformedPayload_isNotRegistered() {
        WebSocketSession session = sessionWithAttributes();

        handler.handleTextMessage(session, new TextMessage("not-a-uuid"));

        assertThat(taskSessions()).isEmpty();
        assertThat(session.getAttributes()).doesNotContainKey("taskId");
    }

    @Test
    @DisplayName("registers a session for a valid task id")
    void validPayload_isRegistered() {
        WebSocketSession session = sessionWithAttributes();
        String taskId = UUID.randomUUID().toString();

        handler.handleTextMessage(session, new TextMessage(taskId));

        assertThat(taskSessions()).containsEntry(taskId, session);
    }

    @Test
    @DisplayName("keeps at most one subscription per session")
    void secondSubscription_replacesTheFirst() {
        WebSocketSession session = sessionWithAttributes();
        String first = UUID.randomUUID().toString();
        String second = UUID.randomUUID().toString();

        handler.handleTextMessage(session, new TextMessage(first));
        handler.handleTextMessage(session, new TextMessage(second));

        assertThat(taskSessions()).hasSize(1);
        assertThat(taskSessions()).containsOnlyKeys(second);
    }

    @Test
    @DisplayName("removes the subscription when the connection closes")
    void closingConnection_removesSubscription() {
        WebSocketSession session = sessionWithAttributes();
        String taskId = UUID.randomUUID().toString();
        handler.handleTextMessage(session, new TextMessage(taskId));

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        assertThat(taskSessions()).isEmpty();
    }
}
