package com.github.codehive.service.assistant;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Tag("postgres-assistant")
class AssistantPostgresSchemaIntegrationTest {
    @Autowired private JdbcTemplate jdbc;

    @Test
    void developmentSchemaAddsPostgresIndexesAndConstraints() throws Exception {
        String database = jdbc.queryForObject("select current_database()", String.class);
        assertThat(database).contains("assistant_test");

        String schema = Files.readString(Path.of("../docs/ai-assistant/AI_USAGE_DEV_SCHEMA.sql"));
        for (String statement : schema.split(";\\s*\\R\\s*\\R")) {
            if (!statement.isBlank()) jdbc.execute(statement);
        }

        List<String> callIndexes = jdbc.queryForList("select indexname from pg_indexes where tablename = 'assistant_model_calls'", String.class);
        assertThat(callIndexes).contains("idx_assistant_call_started", "idx_assistant_call_interaction_started");
        List<String> indexes = jdbc.queryForList("""
                select indexname from pg_indexes where tablename = 'assistant_interactions'
                """, String.class);
        assertThat(indexes).contains("ux_assistant_one_pending", "ix_assistant_history",
                "ix_assistant_pending_lease");
        List<String> constraints = jdbc.queryForList("""
                select conname from pg_constraint where conname in
                ('ck_assignment_ai_policy_quota', 'ck_assistant_charged_status',
                 'ck_assistant_generation_attempts')
                """, String.class);
        assertThat(constraints).containsExactlyInAnyOrder("ck_assignment_ai_policy_quota",
                "ck_assistant_charged_status", "ck_assistant_generation_attempts");
    }
}
