package com.github.codehive.model.exception.recovery;

public class TokenAlreadyUsedException extends RuntimeException {
    public TokenAlreadyUsedException(String message) {
        super(message);
    }

    public TokenAlreadyUsedException(String message, Throwable cause) {
        super(message, cause);
    }

    public TokenAlreadyUsedException(Throwable cause) {
        super(cause);
    }

    public TokenAlreadyUsedException() {
        super("This password reset token has already been used");
    }
}
