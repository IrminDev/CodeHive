package com.github.codehive.model.request.recovery;

import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {
    @NotBlank(message = "Email or enrollment number is required")
    private String identifier;

    public ForgotPasswordRequest() {
    }

    public ForgotPasswordRequest(String identifier) {
        this.identifier = identifier;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }
}
