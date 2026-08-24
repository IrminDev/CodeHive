package com.github.codehive.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.model.request.auth.UpdatePasswordRequest;
import com.github.codehive.model.response.ErrorResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.model.response.auth.AuthResponse;
import com.github.codehive.ratelimit.RateLimit;
import com.github.codehive.service.AuthService;
import com.github.codehive.service.CsvRegistrationService;
import com.github.codehive.websocket.WebSocketTicketService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
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
    private final CsvRegistrationService csvRegistrationService;
    private final WebSocketTicketService webSocketTicketService;

    public AuthController(AuthService authService, CsvRegistrationService csvRegistrationService,
                          WebSocketTicketService webSocketTicketService) {
        this.authService = authService;
        this.csvRegistrationService = csvRegistrationService;
        this.webSocketTicketService = webSocketTicketService;
    }

    @Operation(summary = "Get current user", description = "Returns the authenticated user's information based on the JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User info retrieved",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or missing token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<SuccessResponse<UserDTO>> me(Authentication authentication) {
        UserDTO userDTO = authService.getUserByEmail(authentication.getName());
        SuccessResponse<UserDTO> response = new SuccessResponse<>("User info retrieved", userDTO);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "User login", description = "Authenticate user with email and password")
    @SecurityRequirements
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @RateLimit(key = "auth.login", limit = 5, duration = 60, message = "Too many login attempts. Please try again in 1 minute.")
    @PostMapping("/login")
    public ResponseEntity<SuccessResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        SuccessResponse<AuthResponse> response = new SuccessResponse<>("Login successful", authResponse);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Register a new user", description = "Creates an account with a temporary password. " +
            "Creating students or teachers requires CREATE_USERS; creating admins requires CREATE_ADMINS.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - required admin scope missing",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email or enrollment number already exists",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('ADMIN') and hasAnyAuthority('CREATE_USERS', 'CREATE_ADMINS')")
    @RateLimit(key = "auth.signup", limit = 3, duration = 300, message = "Too many registration attempts. Please try again in 5 minutes.")
    @PostMapping("/signup")
    public ResponseEntity<SuccessResponse<UserDTO>> signup(@Valid @RequestBody SignUpRequest signUpRequest,
                                                            Authentication authentication) {
        UserDTO userDTO = authService.registerAuthorized(signUpRequest, authentication.getName());
        SuccessResponse<UserDTO> response = new SuccessResponse<>("Registration successful", userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Bulk register users from CSV", description = "Uploads students and teachers in CSV columns: role, name, father last name, mother last name, enrollment number, email. " +
            "Requires CREATE_USERS; ADMIN rows are rejected. Returns a taskId tracked through /ws/csv-progress.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "202", description = "CSV processing started",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid CSV file",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('CREATE_USERS')")
    @RateLimit(key = "auth.signup.csv", limit = 2, duration = 600,
            message = "Too many bulk registration uploads")
    @PostMapping(value = "/signup/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SuccessResponse<Map<String, String>>> signupFromCsv(
            @RequestParam("file") MultipartFile file, Authentication authentication) throws IOException {
        if (file.isEmpty()) {
            throw new ValidationException("CSV file is empty");
        }
        byte[] csvData = file.getBytes();
        String taskId = csvRegistrationService.submitCsvJob(csvData, authentication.getName());
        Map<String, String> taskInfo = Map.of("taskId", taskId);
        SuccessResponse<Map<String, String>> response = new SuccessResponse<>("CSV processing started", taskInfo);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @PostMapping("/websocket-ticket")
    @RateLimit(key = "auth.websocket-ticket", limit = 10, duration = 60,
            message = "Too many WebSocket ticket requests")
    @Operation(summary = "Issue a one-time WebSocket ticket",
            description = "Returns a 60-second, single-use ticket for the CSV progress WebSocket handshake.")
    public ResponseEntity<SuccessResponse<Map<String, Object>>> websocketTicket(
            Authentication authentication) {
        UserDTO user = authService.getUserByEmail(authentication.getName());
        Map<String, Object> ticket = Map.of(
                "ticket", webSocketTicketService.issue(user.getId()),
                "expiresInSeconds", WebSocketTicketService.TTL_SECONDS);
        return ResponseEntity.ok(new SuccessResponse<>("WebSocket ticket issued", ticket));
    }

    @Operation(summary = "Update password", description = "Update the authenticated user's password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "401", description = "Invalid current password or token")
    })
    @PutMapping("/me/password")
    public ResponseEntity<SuccessResponse<Void>> updatePassword(
            Authentication authentication,
            @Valid @RequestBody UpdatePasswordRequest request) {
        UserDTO userDTO = authService.getUserByEmail(authentication.getName());
        authService.updatePassword(userDTO.getId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Password updated successfully", null));
    }
}
