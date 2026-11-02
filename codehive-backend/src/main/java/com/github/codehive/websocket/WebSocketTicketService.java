package com.github.codehive.websocket;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class WebSocketTicketService {
    public static final long TTL_SECONDS = 60;
    private static final int MAX_TICKETS = 10_000;
    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();

    public String issue(UUID userId) {
        cleanup();
        if (tickets.size() >= MAX_TICKETS) throw new IllegalStateException("WebSocket ticket capacity reached");
        String value = UUID.randomUUID().toString();
        tickets.put(value, new Ticket(userId, Instant.now().plusSeconds(TTL_SECONDS)));
        return value;
    }

    public Optional<UUID> consume(String value) {
        if (value == null || value.isBlank()) return Optional.empty();
        Ticket ticket = tickets.remove(value);
        if (ticket == null || !ticket.expiresAt().isAfter(Instant.now())) return Optional.empty();
        return Optional.of(ticket.userId());
    }

    @Scheduled(fixedDelayString = "${websocket.ticket-cleanup-ms:60000}")
    public void cleanup() {
        Instant now = Instant.now();
        tickets.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
    }

    private record Ticket(UUID userId, Instant expiresAt) {}
}
