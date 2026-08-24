package com.github.codehive.model.exception.handler;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ArtifactExpiredException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.exception.RoleTransitionConflictException;
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

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    @ExceptionHandler(RoleTransitionConflictException.class)
    public ResponseEntity<ErrorResponse> handleRoleTransitionConflict(RoleTransitionConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(ex.getMessage(), ex.getBlockers()));
    }

    @ExceptionHandler(IncorrectCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleIncorrectCredentials(IncorrectCredentialsException ex) {
        String message = ex.getMessage();
        if (message == null || message.equals("Invalid credentials")) {
            message = "Invalid email or password";
        }
        ErrorResponse errorResponse = new ErrorResponse("Authentication failed", message);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    @ExceptionHandler(AlreadyRegisteredEmailException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyRegisteredEmail(AlreadyRegisteredEmailException ex) {
        ErrorResponse errorResponse = new ErrorResponse("Registration failed", "Email already exists");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(AlreadyRegisteredEnrollmentNumberException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyRegisteredEnrollmentNumber(
            AlreadyRegisteredEnrollmentNumberException ex) {
        ErrorResponse errorResponse = new ErrorResponse("Registration failed", "Enrollment number already exists");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Resource not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(ArtifactExpiredException.class)
    public ResponseEntity<ErrorResponse> handleArtifactExpired(ArtifactExpiredException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Execution artifacts expired");
        return ResponseEntity.status(HttpStatus.GONE).body(errorResponse);
    }

    @ExceptionHandler(TokenNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTokenNotFound(TokenNotFoundException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Invalid or expired token");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(ExpiredRecoveryTokenException.class)
    public ResponseEntity<ErrorResponse> handleExpiredRecoveryToken(ExpiredRecoveryTokenException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Token has expired");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(InvalidRecoveryTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRecoveryToken(InvalidRecoveryTokenException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Invalid or expired token");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(TokenAlreadyUsedException.class)
    public ResponseEntity<ErrorResponse> handleTokenAlreadyUsed(TokenAlreadyUsedException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "Token has already been used");
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
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", Long.toString(ex.getRetryAfterSeconds()))
                .header("X-RateLimit-Limit", Integer.toString(ex.getLimit()))
                .header("X-RateLimit-Policy", ex.getPolicy())
                .body(errorResponse);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        ErrorResponse errorResponse = new ErrorResponse("Invalid request format", "Malformed request body");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        String message = "Content-Type not supported";
        if (ex.getContentType() != null) {
            message = "Content-Type '" + ex.getContentType() + "' is not supported";
        }
        ErrorResponse errorResponse = new ErrorResponse("Unsupported Media Type", message);
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(errorResponse);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorResponse("Request method is not supported", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponse errorResponse = new ErrorResponse("Access denied", "You don't have permission to perform this action");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        logger.error("Unhandled exception", ex);
        ErrorResponse errorResponse = new ErrorResponse("An unexpected error occurred", "Internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
