package com.github.codehive.websocket;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class WebSocketTicketServiceTest {
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Test
    void ticketIsSingleUseAndBoundToIssuer() {
        WebSocketTicketService service = new WebSocketTicketService();
        String ticket = service.issue(USER_ID);

        assertThat(service.consume(ticket)).contains(USER_ID);
        assertThat(service.consume(ticket)).isEmpty();
    }

    @Test
    void unknownTicketIsRejected() {
        WebSocketTicketService service = new WebSocketTicketService();

        assertThat(service.consume("missing-ticket")).isEmpty();
    }
}
