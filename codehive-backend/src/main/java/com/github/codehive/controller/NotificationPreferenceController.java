package com.github.codehive.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.NotificationSettingsDTO;
import com.github.codehive.model.request.notification.UpdateNotificationSettingsRequest;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.NotificationPreferenceService;
import com.github.codehive.service.AuthService;
import com.github.codehive.service.MailSenderService;
import com.github.codehive.ratelimit.RateLimit;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notification-preferences")
@Tag(name = "Notification Preferences", description = "Authenticated user email notification preferences")
public class NotificationPreferenceController {
    private final NotificationPreferenceService preferenceService;
    private final AuthService authService;
    private final MailSenderService mailSenderService;

    public NotificationPreferenceController(NotificationPreferenceService preferenceService,
                                            AuthService authService,
                                            MailSenderService mailSenderService) {
        this.preferenceService = preferenceService;
        this.authService = authService;
        this.mailSenderService = mailSenderService;
    }

    @Operation(summary = "Get notification preferences",
            description = "Returns the authenticated user's global settings and role-specific notification catalog.")
    @ApiResponse(responseCode = "200", description = "Notification preferences retrieved")
    @GetMapping
    public ResponseEntity<SuccessResponse<NotificationSettingsDTO>> get(Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Notification preferences retrieved",
                preferenceService.getForUser(authentication.getName())));
    }

    @Operation(summary = "Update notification preferences",
            description = "Updates the authenticated user's global email settings and per-type overrides.")
    @ApiResponse(responseCode = "200", description = "Notification preferences updated")
    @PutMapping
    public ResponseEntity<SuccessResponse<NotificationSettingsDTO>> update(
            Authentication authentication,
            @Valid @RequestBody UpdateNotificationSettingsRequest request) {
        return ResponseEntity.ok(new SuccessResponse<>("Notification preferences updated",
                preferenceService.update(authentication.getName(), request)));
    }

    @Operation(summary = "Reset notification preferences",
            description = "Deletes the authenticated user's overrides and restores role defaults.")
    @ApiResponse(responseCode = "200", description = "Notification preferences reset")
    @PostMapping("/reset")
    public ResponseEntity<SuccessResponse<NotificationSettingsDTO>> reset(Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Notification preferences reset to defaults",
                preferenceService.reset(authentication.getName())));
    }

    @Operation(summary = "Send a test notification email",
            description = "Sends a branded test email to the authenticated user's registered address.")
    @ApiResponse(responseCode = "200", description = "Test email sent")
    @PostMapping("/test-email")
    @RateLimit(key = "notifications.test-email", limit = 3, duration = 300, message = "Too many test email requests")
    public ResponseEntity<SuccessResponse<Void>> testEmail(Authentication authentication) {
        com.github.codehive.model.dto.UserDTO user = authService.getUserByEmail(authentication.getName());
        mailSenderService.sendTestNotificationEmail(user.getEmail(), user.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Test notification email sent", null));
    }
}
