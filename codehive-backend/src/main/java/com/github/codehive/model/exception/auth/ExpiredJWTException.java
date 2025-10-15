package com.github.codehive.model.exception.auth;

public class ExpiredJWTException extends RuntimeException {
    public ExpiredJWTException(String message) {
        super(message);
    }

    public ExpiredJWTException(String message, Throwable cause) {
        super(message, cause);
    }

    public ExpiredJWTException(Throwable cause) {
        super(cause);
    }

    public ExpiredJWTException() {
        super("The JWT has expired.");
    }
}
