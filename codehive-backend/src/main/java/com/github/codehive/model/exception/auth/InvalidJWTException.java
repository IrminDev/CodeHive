package com.github.codehive.model.exception.auth;

public class InvalidJWTException extends RuntimeException {
    public InvalidJWTException(String message) {
        super(message);
    }

    public InvalidJWTException(String message, Throwable cause) {
        super(message, cause);
    }

    public InvalidJWTException(Throwable cause) {
        super(cause);
    }

    public InvalidJWTException() {
        super("The JWT is invalid.");
    }
}
