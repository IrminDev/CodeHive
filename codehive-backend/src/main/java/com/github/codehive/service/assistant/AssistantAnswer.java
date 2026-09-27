package com.github.codehive.service.assistant;

import java.util.List;

public record AssistantAnswer(String explanation, List<Snippet> snippets, String followUpQuestion) {
    public record Snippet(String language, String code) {}
}
