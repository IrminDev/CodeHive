package com.github.codehive.model.exception.auth;

public class BlockedUserException extends RuntimeException {
    public BlockedUserException() {
        super("User account is blocked");
    }
}
