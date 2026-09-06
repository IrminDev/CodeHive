package com.github.codehive.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TestSuiteUpdateMode {
    APPEND,
    REPLACE_ALL;

    /**
     * Accept requests from browser sessions that loaded the pre-rename frontend.
     * Responses and current clients use the canonical {@code REPLACE_ALL} value.
     */
    @JsonCreator
    public static TestSuiteUpdateMode fromValue(String value) {
        return "REPLACE".equals(value) ? REPLACE_ALL : valueOf(value);
    }
}
