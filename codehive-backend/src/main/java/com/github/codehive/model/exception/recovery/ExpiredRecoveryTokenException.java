package com.github.codehive.model.exception.recovery;

public class ExpiredRecoveryTokenException extends RuntimeException {
    public ExpiredRecoveryTokenException(String message) {
        super(message);
    }

    public ExpiredRecoveryTokenException(String message, Throwable cause) {
        super(message, cause);
    }

    public ExpiredRecoveryTokenException(Throwable cause) {
        super(cause);
    }

    public ExpiredRecoveryTokenException() {
        super("The recovery token has expired.");
    }
}
