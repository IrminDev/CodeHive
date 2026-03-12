package com.github.codehive.controller;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.model.response.auth.AuthResponse;
import com.github.codehive.model.response.auth.CsvBulkRegisterResponse;
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

    @Operation(summary = "Register a new user (Admin only)", description = "Register a new user account. Only admins can perform this action. A temporary password will be generated and sent via email.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email or enrollment number already exists",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('ADMIN')")
    @RateLimit(limit = 3, duration = 300, message = "Too many registration attempts. Please try again in 5 minutes.")
    @PostMapping("/signup")
    public ResponseEntity<SuccessResponse<UserDTO>> signup(@Valid @RequestBody SignUpRequest signUpRequest) {
        UserDTO userDTO = authService.register(signUpRequest);
        SuccessResponse<UserDTO> response = new SuccessResponse<>("Registration successful", userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Bulk register users from CSV (Admin only)", description = "Upload a CSV file to register multiple users. CSV columns: role (STUDENT/TEACHER/ADMIN), name, father last name, mother last name, enrollment number, email. Temporary passwords will be generated and sent via email.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "CSV processed",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid CSV file",
                    content = @Content(schema = @Schema(implementation = com.github.codehive.model.response.ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(value = "/signup/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SuccessResponse<CsvBulkRegisterResponse>> signupFromCsv(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new com.github.codehive.model.exception.ValidationException("CSV file is empty");
        }
        CsvBulkRegisterResponse result = authService.registerFromCsv(file);
        SuccessResponse<CsvBulkRegisterResponse> response = new SuccessResponse<>("CSV processed", result);
        return ResponseEntity.ok(response);
    }
}
