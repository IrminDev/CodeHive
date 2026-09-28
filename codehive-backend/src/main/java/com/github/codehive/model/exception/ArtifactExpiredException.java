package com.github.codehive.model.exception;

public class ArtifactExpiredException extends RuntimeException {
    public ArtifactExpiredException(String message) {
        super(message);
    }
}
