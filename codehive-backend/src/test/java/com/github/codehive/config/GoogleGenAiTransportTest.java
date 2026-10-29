package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.env.MockEnvironment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.service.assistant.AssistantContextService;
import com.github.codehive.service.assistant.AssistantGuardrailService;
import com.github.codehive.service.assistant.AssistantStateException;
import com.github.codehive.service.assistant.SpringAiAssistantModelGateway;
import com.sun.net.httpserver.HttpServer;

/** Real Spring AI and Google SDK, with synthetic responses from a loopback HTTP server. */
class GoogleGenAiTransportTest {
    private static final java.util.UUID ASSIGNMENT = java.util.UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String ANSWER = "{\"explanation\":\"A loop repeats an operation.\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}";
    private final ObjectMapper mapper = new ObjectMapper();
    private final List<JsonNode> requests = new CopyOnWriteArrayList<>();
    private final AtomicInteger failureStatus = new AtomicInteger();
    private final AtomicInteger disconnectOnRequest = new AtomicInteger();
    private final CountDownLatch releaseResponse = new CountDownLatch(1);
    private List<String> replies;
    private HttpServer server;
    private Client client;
    private SpringAiAssistantModelGateway gateway;

    @BeforeEach
    void setup() throws IOException {
        replies = List.of("{\"decision\":\"ALLOW\"}", ANSWER, "{\"approved\":true}");
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            requests.add(mapper.readTree(exchange.getRequestBody()));
            int status = requests.size() == disconnectOnRequest.get() ? -1 : failureStatus.get();
            if (status == -2) {
                try { releaseResponse.await(10, TimeUnit.SECONDS); }
                catch (InterruptedException exception) { Thread.currentThread().interrupt(); }
                exchange.close();
                return;
            }
            if (status == -1) {
                exchange.close();
                return;
            }
            String body = status == 0 ? mapper.writeValueAsString(java.util.Map.of(
                    "modelVersion", "test-model",
                    "candidates", List.of(java.util.Map.of("content", java.util.Map.of(
                            "role", "model", "parts", List.of(java.util.Map.of("text", replies.get(requests.size() - 1)))),
                            "finishReason", "STOP")),
                    "usageMetadata", java.util.Map.of("promptTokenCount", 10, "candidatesTokenCount", 5, "totalTokenCount", 15)))
                    : "{\"error\":{\"code\":" + status + ",\"message\":\"synthetic failure\",\"status\":\"UNAVAILABLE\"}}";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            if (status == 503) exchange.getResponseHeaders().set("Retry-After", "0");
            if (status == 307) exchange.getResponseHeaders().set("Location", "/redirected");
            exchange.sendResponseHeaders(status == 0 ? 200 : status, bytes.length);
            try (var output = exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        var environment = new MockEnvironment()
                .withProperty("spring.ai.google.genai.api-key", "synthetic-test-key")
                .withProperty("assistant.google-genai.base-url", "http://127.0.0.1:" + server.getAddress().getPort());
        client = new AssistantGoogleGenAiConfiguration().assistantGoogleGenAiClient(environment);
        ChatModel model = GoogleGenAiChatModel.builder().genAiClient(client)
                .defaultOptions(GoogleGenAiChatOptions.builder().model("test-model").build())
                .retryTemplate(new AssistantGoogleGenAiConfiguration().assistantModelRetryTemplate()).build();
        @SuppressWarnings("unchecked") ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        when(provider.getIfUnique()).thenReturn(model);
        gateway = new SpringAiAssistantModelGateway(provider, 2, 100);
    }

    @AfterEach
    void cleanup() {
        releaseResponse.countDown();
        if (gateway != null) gateway.shutdown();
        if (client != null) client.close();
        if (server != null) server.stop(0);
    }

    @Test
    void approvedFlowSendsThreeRequestsWithDistinctNativeSchemas() {
        var decision = guardrails().generate(context(), "What is a loop?", AiAssistanceLevel.CONCEPTUAL_ONLY);
        assertThat(decision.status()).isEqualTo(AssistantInteractionStatus.COMPLETED);
        assertThat(requests).hasSize(3);
        assertThat(schema(0).path("properties").path("decision").path("enum").toString())
                .isEqualTo("[\"ALLOW\",\"REDIRECT\",\"BLOCK\"]");
        assertThat(schema(1).path("required").toString())
                .isEqualTo("[\"explanation\",\"snippets\",\"followUpQuestion\"]");
        assertThat(schema(2).path("properties").path("approved").path("type").asText()).isEqualTo("boolean");
        for (JsonNode request : requests) {
            assertThat(request.path("generationConfig").path("responseMimeType").asText()).isEqualTo("application/json");
            assertThat(request.path("generationConfig").path("candidateCount").asInt()).isEqualTo(1);
            assertThat(request.path("tools").isMissingNode() || request.path("tools").isEmpty()).isTrue();
        }
    }

    @Test
    void semanticRejectionAndRegenerationSendExactlyFiveRequests() {
        replies = List.of("{\"decision\":\"ALLOW\"}", ANSWER, "{\"approved\":false}", ANSWER, "{\"approved\":true}");
        var decision = guardrails().generate(context(), "Help", AiAssistanceLevel.CONCEPTUAL_ONLY);
        assertThat(decision.status()).isEqualTo(AssistantInteractionStatus.COMPLETED);
        assertThat(decision.generationAttempts()).isEqualTo(2);
        assertThat(requests).hasSize(5);
        assertThat(schema(3)).isEqualTo(schema(1));
        assertThat(schema(4)).isEqualTo(schema(2));
    }

    @ParameterizedTest
    @ValueSource(ints = {429, 500, 503, 307, -1})
    void providerErrorsAndDisconnectsAreNotRetried(int status) {
        failureStatus.set(status);
        assertThatThrownBy(() -> guardrails().generate(context(), "Help", AiAssistanceLevel.CONCEPTUAL_ONLY))
                .isInstanceOf(AssistantStateException.class)
                .hasMessage(status == 429 ? "MODEL_RATE_LIMITED" : "MODEL_FAILURE");
        assertThat(requests).hasSize(1);
    }

    @Test
    void disconnectAfterConnectionReuseIsNotRetried() {
        guardrails().generate(context(), "Help", AiAssistanceLevel.CONCEPTUAL_ONLY);
        failureStatus.set(-1);
        assertThatThrownBy(() -> guardrails().generate(context(), "Help again", AiAssistanceLevel.CONCEPTUAL_ONLY))
                .isInstanceOf(AssistantStateException.class).hasMessage("MODEL_FAILURE");
        assertThat(requests).hasSize(4);
    }

    @Test
    void disconnectDuringLastReviewStillKeepsRegenerationFlowWithinFiveRequests() {
        replies = List.of("{\"decision\":\"ALLOW\"}", ANSWER, "{\"approved\":false}", ANSWER, "{\"approved\":true}");
        disconnectOnRequest.set(5);
        assertThatThrownBy(() -> guardrails().generate(context(), "Help", AiAssistanceLevel.CONCEPTUAL_ONLY))
                .isInstanceOf(AssistantStateException.class).hasMessage("MODEL_FAILURE");
        assertThat(requests).hasSize(5);
    }

    @Test
    void timeoutDoesNotStartAnotherHttpRequest() {
        failureStatus.set(-2);
        assertThatThrownBy(() -> guardrails().generate(context(), "Help", AiAssistanceLevel.CONCEPTUAL_ONLY))
                .isInstanceOf(AssistantStateException.class).hasMessage("MODEL_TIMEOUT");
        assertThat(requests).hasSize(1);
    }

    private JsonNode schema(int index) { return requests.get(index).path("generationConfig").path("responseJsonSchema"); }

    private AssistantGuardrailService guardrails() { return new AssistantGuardrailService(gateway, mapper); }

    private AssistantContextService.Context context() {
        var assignment = new AssistantContextService.PublicAssignment(ASSIGNMENT, "Loops", "Explain loops",
                List.of(), List.of(), List.of(), List.of(Language.JAVA), List.of());
        return new AssistantContextService.Context(assignment, null, null, false, List.of(), false);
    }
}
