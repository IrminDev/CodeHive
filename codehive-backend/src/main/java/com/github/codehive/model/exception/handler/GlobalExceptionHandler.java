package com.github.codehive.model.exception.handler;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEmailException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEnrollmentNumberException;
import com.github.codehive.model.exception.auth.ExpiredJWTException;
import com.github.codehive.model.exception.auth.IncorrectCredentialsException;
import com.github.codehive.model.exception.auth.InvalidJWTException;
import com.github.codehive.model.exception.recovery.ExpiredRecoveryTokenException;
import com.github.codehive.model.exception.recovery.InvalidRecoveryTokenException;
import com.github.codehive.model.exception.recovery.TokenAlreadyUsedException;
import com.github.codehive.model.exception.recovery.TokenNotFoundException;
import com.github.codehive.model.response.ErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        ErrorResponse errorResponse = new ErrorResponse("Validation failed", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(ValidationException ex) {
        if (ex.getErrors() != null && !ex.getErrors().isEmpty()) {
            ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), ex.getErrors());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } else {
            ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Validation error");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @ExceptionHandler(IncorrectCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleIncorrectCredentials(IncorrectCredentialsException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Authentication failed");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    @ExceptionHandler(AlreadyRegisteredEmailException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyRegisteredEmail(AlreadyRegisteredEmailException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Duplicate email");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(AlreadyRegisteredEnrollmentNumberException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyRegisteredEnrollmentNumber(
            AlreadyRegisteredEnrollmentNumberException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Duplicate enrollment number");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Resource not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(TokenNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTokenNotFound(TokenNotFoundException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Token not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(ExpiredRecoveryTokenException.class)
    public ResponseEntity<ErrorResponse> handleExpiredRecoveryToken(ExpiredRecoveryTokenException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Token expired");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(InvalidRecoveryTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRecoveryToken(InvalidRecoveryTokenException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Invalid token");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(TokenAlreadyUsedException.class)
    public ResponseEntity<ErrorResponse> handleTokenAlreadyUsed(TokenAlreadyUsedException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Token already used");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(ExpiredJWTException.class)
    public ResponseEntity<ErrorResponse> handleExpiredJWT(ExpiredJWTException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "JWT expired");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    @ExceptionHandler(InvalidJWTException.class)
    public ResponseEntity<ErrorResponse> handleInvalidJWT(InvalidJWTException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Invalid JWT");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    @ExceptionHandler(com.github.codehive.ratelimit.RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceeded(com.github.codehive.ratelimit.RateLimitExceededException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Rate limit exceeded");
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse errorResponse = new ErrorResponse("An unexpected error occurred", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
