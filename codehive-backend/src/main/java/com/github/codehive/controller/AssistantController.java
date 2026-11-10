package com.github.codehive.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.assistant.AssistantAvailabilityDTO;
import com.github.codehive.model.dto.assistant.AssistantMessageResultDTO;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.request.assistant.AssistantMessageRequest;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.ratelimit.RateLimit;
import com.github.codehive.service.assistant.AssistantService;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/assignments/{assignmentId}/assistant")
@Tag(name = "Educational Assistant", description = "Student-only guarded educational assistance")
public class AssistantController {
    private final AssistantService assistant;

    public AssistantController(AssistantService assistant) {
        this.assistant = assistant;
    }

    @GetMapping
    @Operation(summary = "Get student assistant availability and lifetime quota")
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Availability retrieved"),
            @ApiResponse(responseCode = "403", description = "Student access required"),
            @ApiResponse(responseCode = "404", description = "Assignment inaccessible") })
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<SuccessResponse<AssistantAvailabilityDTO>> availability(
            @PathVariable UUID assignmentId, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assistant availability retrieved.",
                assistant.availability(assignmentId, authentication.getName())));
    }

    @PostMapping("/interactions")
    @Operation(summary = "Request one guarded educational assistant response")
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Validated or blocked result"),
            @ApiResponse(responseCode = "202", description = "Matching request still pending"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "403", description = "Assistance not allowed"),
            @ApiResponse(responseCode = "409", description = "Pending, conflicting, or cancelled request"),
            @ApiResponse(responseCode = "429", description = "Quota or rate limit reached"),
            @ApiResponse(responseCode = "502", description = "Model output rejected"),
            @ApiResponse(responseCode = "503", description = "Assistant or provider unavailable"),
            @ApiResponse(responseCode = "504", description = "Provider timeout") })
    @PreAuthorize("hasAuthority('STUDENT')")
    @RateLimit(key = "assistant.message", limit = 10, duration = 60)
    public ResponseEntity<SuccessResponse<AssistantMessageResultDTO>> ask(
            @PathVariable UUID assignmentId, @Valid @RequestBody AssistantMessageRequest request,
            Authentication authentication) {
        AssistantMessageResultDTO result = assistant.ask(assignmentId, request, authentication.getName());
        HttpStatus status = result.interaction().status() == AssistantInteractionStatus.PENDING
                ? HttpStatus.ACCEPTED : HttpStatus.OK;
        return ResponseEntity.status(status).body(new SuccessResponse<>("Assistant interaction retrieved.", result));
    }
}
