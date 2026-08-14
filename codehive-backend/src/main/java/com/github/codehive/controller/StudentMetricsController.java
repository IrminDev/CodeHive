package com.github.codehive.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.metrics.StudentMetricsDTO;
import com.github.codehive.model.response.ErrorResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.GroupMetricsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Student-facing self metrics. A student may only read their own performance in a
 * group where they hold an active enrollment; grades are limited to returned ones.
 */
@RestController
@Tag(name = "Student Metrics", description = "Student-facing self performance metrics")
public class StudentMetricsController {
    private final GroupMetricsService metricsService;

    public StudentMetricsController(GroupMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Operation(summary = "Get my metrics summary for a group",
            description = "Returns the authenticated student's own completion, punctuality, score (returned grades only), attempt, and missing-assignment metrics over the group's published assignments.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Metrics retrieved"),
            @ApiResponse(responseCode = "403", description = "Caller is not an actively enrolled student", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('STUDENT')")
    @GetMapping("/api/groups/{groupId}/metrics/me")
    public ResponseEntity<SuccessResponse<StudentMetricsDTO>> me(
            @Parameter(description = "Group ID") @PathVariable UUID groupId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Your group metrics retrieved successfully",
                metricsService.myGroupMetrics(groupId, authentication.getName())));
    }
}
