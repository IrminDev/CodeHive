package com.github.codehive.model.exception.recovery;

public class InvalidRecoveryTokenException extends RuntimeException {
    public InvalidRecoveryTokenException(String message) {
        super(message);
    }

    public InvalidRecoveryTokenException(String message, Throwable cause) {
        super(message, cause);
    }

    public InvalidRecoveryTokenException(Throwable cause) {
        super(cause);
    }

    public InvalidRecoveryTokenException() {
        super("The recovery token is invalid.");
    }
}
