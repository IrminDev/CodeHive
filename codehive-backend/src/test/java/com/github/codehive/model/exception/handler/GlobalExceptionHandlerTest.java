package com.github.codehive.model.exception.handler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import com.github.codehive.model.response.ErrorResponse;

@DisplayName("GlobalExceptionHandler information leakage")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("generic handler returns a generic 500 without the internal message")
    void handleGenericException_doesNotLeakInternalDetails() {
        RuntimeException internal = new RuntimeException("constraint users_email_key violated at schema public");

        ResponseEntity<ErrorResponse> response = handler.handleGenericException(internal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getError()).isEqualTo("Internal server error");
        assertThat(response.getBody().getError()).doesNotContain("users_email_key");
        assertThat(response.getBody().getMessage()).doesNotContain("users_email_key");
    }

    @Test
    @DisplayName("malformed body handler does not echo parser internals")
    void handleHttpMessageNotReadable_doesNotLeakParserDetails() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException(
                "boom",
                new RuntimeException("Cannot deserialize com.github.codehive.model.enums.Role"),
                mock(HttpInputMessage.class));

        ResponseEntity<ErrorResponse> response = handler.handleHttpMessageNotReadable(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getError()).isEqualTo("Malformed request body");
        assertThat(response.getBody().getError()).doesNotContain("com.github.codehive");
    }
}
