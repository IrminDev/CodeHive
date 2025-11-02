package com.github.codehive.model.response;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse extends ApiResponse {
    private final LocalDateTime timestamp;
    private final String error;
    private final List<String> errors;

    public ErrorResponse(String message, String error) {
        super(false, message);
        this.timestamp = LocalDateTime.now();
        this.error = error;
        this.errors = null;
    }

    public ErrorResponse(String message, List<String> errors) {
        super(false, message);
        this.timestamp = LocalDateTime.now();
        this.error = null;
        this.errors = errors;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getError() {
        return error;
    }

    public List<String> getErrors() {
        return errors;
    }
}
