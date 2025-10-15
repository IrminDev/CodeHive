package com.github.codehive.model.exception.auth;

public class IncorrectCredentialsException extends RuntimeException {
    public IncorrectCredentialsException(String message) {
        super(message);
    }

    public IncorrectCredentialsException(String message, Throwable cause) {
        super(message, cause);
    }

    public IncorrectCredentialsException(Throwable cause) {
        super(cause);
    }

    public IncorrectCredentialsException() {
        super("The provided credentials are incorrect.");
    }
}
