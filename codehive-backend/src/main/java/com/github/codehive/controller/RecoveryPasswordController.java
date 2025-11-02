package com.github.codehive.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.request.recovery.ForgotPasswordRequest;
import com.github.codehive.model.request.recovery.RecoveryPasswordRequest;
import com.github.codehive.model.response.MessageResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.ratelimit.RateLimit;
import com.github.codehive.service.RecoveryPasswordService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/recovery-password")
@Tag(name = "Password Recovery", description = "Password reset and recovery APIs")
public class RecoveryPasswordController {
    private final RecoveryPasswordService recoveryPasswordService;

    public RecoveryPasswordController(RecoveryPasswordService recoveryPasswordService) {
        this.recoveryPasswordService = recoveryPasswordService;
    }

    @Operation(summary = "Request password reset", description = "Send password reset email to user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset email sent (if email exists)",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class)))
    })
    @RateLimit(limit = 3, duration = 300, message = "Too many password reset requests. Please try again in 5 minutes.")
    @PostMapping("/forgot")
    public ResponseEntity<SuccessResponse<MessageResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        recoveryPasswordService.sendPasswordResetEmail(request.getEmail());
        MessageResponse messageResponse = new MessageResponse(
                "If the email exists, a password reset link has been sent");
        SuccessResponse<MessageResponse> response = new SuccessResponse<>(
                "Password reset email sent", messageResponse);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Reset password", description = "Reset password using valid token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset successful",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or expired token",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Token not found",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class)))
    })
    
    @RateLimit(limit = 5, duration = 300, message = "Too many password reset attempts. Please try again in 5 minutes.")
    @PostMapping("/reset")
    public ResponseEntity<SuccessResponse<MessageResponse>> resetPassword(
            @Valid @RequestBody RecoveryPasswordRequest request) {
        recoveryPasswordService.resetPassword(request.getToken(), request.getNewPassword());
        MessageResponse messageResponse = new MessageResponse("Password has been reset successfully");
        SuccessResponse<MessageResponse> response = new SuccessResponse<>(
                "Password reset successful", messageResponse);
        return ResponseEntity.ok(response);
    }
}
