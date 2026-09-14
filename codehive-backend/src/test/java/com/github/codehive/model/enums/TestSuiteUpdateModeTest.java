package com.github.codehive.model.enums;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class TestSuiteUpdateModeTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesLegacyReplaceAliasAsCanonicalMode() throws Exception {
        TestSuiteUpdateMode mode = objectMapper.readValue("\"REPLACE\"", TestSuiteUpdateMode.class);

        assertThat(mode).isEqualTo(TestSuiteUpdateMode.REPLACE_ALL);
    }
}
