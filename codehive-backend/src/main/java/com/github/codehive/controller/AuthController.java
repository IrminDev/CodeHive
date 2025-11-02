package com.github.codehive.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.model.response.auth.AuthResponse;
import com.github.codehive.ratelimit.RateLimit;
import com.github.codehive.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication management APIs")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "User login", description = "Authenticate user with email and password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class)))
    })
    @RateLimit(limit = 5, duration = 60, message = "Too many login attempts. Please try again in 1 minute.")
    @PostMapping("/login")
    public ResponseEntity<SuccessResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        SuccessResponse<AuthResponse> response = new SuccessResponse<>("Login successful", authResponse);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "User registration", description = "Register a new user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email or enrollment number already exists",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class)))
    })
    @RateLimit(limit = 3, duration = 300, message = "Too many registration attempts. Please try again in 5 minutes.")
    @PostMapping("/signup")
    public ResponseEntity<SuccessResponse<AuthResponse>> signup(@Valid @RequestBody SignUpRequest signUpRequest) {
        AuthResponse authResponse = authService.register(signUpRequest);
        SuccessResponse<AuthResponse> response = new SuccessResponse<>("Registration successful", authResponse);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
