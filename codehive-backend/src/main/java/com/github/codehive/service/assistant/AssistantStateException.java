package com.github.codehive.service.assistant;

public class AssistantStateException extends RuntimeException {
    private final String code;

    public AssistantStateException(String code) {
        super(code);
        this.code = code;
    }

    public String getCode() { return code; }
}
