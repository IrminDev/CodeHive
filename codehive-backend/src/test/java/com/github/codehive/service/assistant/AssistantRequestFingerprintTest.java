package com.github.codehive.service.assistant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.enums.Language;

class AssistantRequestFingerprintTest {
    @Test
    void optInsAndEditorSnapshotAffectRetryIdentity() {
        String base = AssistantRequestFingerprint.of("Question", Language.JAVA, false, null, false);
        assertThat(AssistantRequestFingerprint.of("Question", Language.JAVA, false, null, true))
                .isNotEqualTo(base);
        assertThat(AssistantRequestFingerprint.of("Question", Language.JAVA, true, "code A", false))
                .isNotEqualTo(base)
                .isNotEqualTo(AssistantRequestFingerprint.of("Question", Language.JAVA, true,
                        "code B", false));
        assertThat(AssistantRequestFingerprint.of("Question", Language.JAVA, false, null, false))
                .isEqualTo(base);
    }
}
