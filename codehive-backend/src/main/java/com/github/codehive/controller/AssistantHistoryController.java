package com.github.codehive.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.assistant.AssistantInteractionDTO;
import com.github.codehive.model.response.PageResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.AssistantHistoryService;

import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/assignments/{assignmentId}/assistant/interactions")
public class AssistantHistoryController {
    private final AssistantHistoryService historyService;

    public AssistantHistoryController(AssistantHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    @Operation(summary = "List the authenticated student's assistant interaction history")
    public ResponseEntity<SuccessResponse<PageResponse<AssistantInteractionDTO>>> history(
            @PathVariable UUID assignmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assistant history retrieved.",
                new PageResponse<>(historyService.history(assignmentId, page, size, authentication.getName()))));
    }

    @GetMapping("/{interactionId}")
    @Operation(summary = "Get one of the authenticated student's assistant interactions")
    public ResponseEntity<SuccessResponse<AssistantInteractionDTO>> get(
            @PathVariable UUID assignmentId, @PathVariable UUID interactionId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assistant interaction retrieved.",
                historyService.get(assignmentId, interactionId, authentication.getName())));
    }
}
