package com.github.codehive.model.exception.auth;

public class AlreadyRegisteredEmailException extends RuntimeException {
    public AlreadyRegisteredEmailException(String message) {
        super(message);
    }

    public AlreadyRegisteredEmailException(String message, Throwable cause) {
        super(message, cause);
    }

    public AlreadyRegisteredEmailException(Throwable cause) {
        super(cause);
    }

    public AlreadyRegisteredEmailException() {
        super("This email is already registered.");
    }
}
