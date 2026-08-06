package com.github.codehive.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.SubmissionLifecycleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/submissions")
@Tag(name = "Submissions", description = "Submission lifecycle APIs")
public class SubmissionController {
    private final SubmissionLifecycleService submissionLifecycleService;

    public SubmissionController(SubmissionLifecycleService submissionLifecycleService) {
        this.submissionLifecycleService = submissionLifecycleService;
    }

    @PostMapping("/{submissionId}/withdraw")
    @Operation(summary = "Withdraw the current submission")
    @ApiResponse(responseCode = "200", description = "Submission withdrawn")
    public ResponseEntity<SuccessResponse<Void>> withdraw(
            @PathVariable UUID submissionId, Authentication authentication) {
        submissionLifecycleService.withdraw(submissionId, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Submission withdrawn.", null));
    }
}
