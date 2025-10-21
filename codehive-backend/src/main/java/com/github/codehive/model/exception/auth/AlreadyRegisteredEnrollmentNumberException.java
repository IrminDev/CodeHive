package com.github.codehive.model.exception.auth;

public class AlreadyRegisteredEnrollmentNumberException extends RuntimeException {
    public AlreadyRegisteredEnrollmentNumberException(String message) {
        super(message);
    }

    public AlreadyRegisteredEnrollmentNumberException() {
        super("Enrollment number is already registered");
    }    
}
