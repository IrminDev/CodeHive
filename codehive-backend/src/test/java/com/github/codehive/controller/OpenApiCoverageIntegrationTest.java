package com.github.codehive.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiCoverageIntegrationTest {
    private static final Set<String> HTTP_METHODS = Set.of("get", "post", "put", "patch", "delete");

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void everyRestOperationHasSummaryTagAndResponses() throws Exception {
        String document = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode paths = objectMapper.readTree(document).path("paths");

        assertThat(paths.isObject()).isTrue();
        paths.properties().forEach(path -> path.getValue().properties().forEach(operation -> {
            if (!HTTP_METHODS.contains(operation.getKey())) return;
            JsonNode value = operation.getValue();
            assertThat(value.path("summary").asText()).as(path.getKey() + " " + operation.getKey()).isNotBlank();
            assertThat(value.path("tags").isArray()).as(path.getKey() + " tags").isTrue();
            assertThat(value.path("responses").size()).as(path.getKey() + " responses").isGreaterThan(0);
        }));
    }

    @Test
    void publicOperationsOverrideGlobalBearerSecurity() throws Exception {
        JsonNode paths = objectMapper.readTree(mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("paths");

        assertThat(paths.path("/api/auth/login").path("post").path("security").isArray()).isTrue();
        assertThat(paths.path("/api/auth/login").path("post").path("security").isEmpty()).isTrue();
        assertThat(paths.path("/api/recovery-password/forgot").path("post").path("security").isEmpty()).isTrue();
    }
}
