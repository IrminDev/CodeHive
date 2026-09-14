package com.github.codehive.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.metrics.AssignmentMetricsDTO;
import com.github.codehive.model.dto.metrics.AssignmentMetricsDetailDTO;
import com.github.codehive.model.dto.metrics.GroupMetricsOverviewDTO;
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
 * Teacher-facing performance metrics. Authorization is ownership-based in the
 * service layer (the group owner, regardless of role), so no role authority is
 * required here.
 */
@RestController
@Tag(name = "Group Metrics", description = "Teacher-facing student performance metrics")
public class GroupMetricsController {
    private final GroupMetricsService metricsService;

    public GroupMetricsController(GroupMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Operation(summary = "Get group metrics overview",
            description = "Returns enrollment, assignment, completion, score, punctuality, and grading aggregates of an owned group. Aggregates without data are null.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Group metrics retrieved"),
            @ApiResponse(responseCode = "403", description = "Caller is not the group owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/api/groups/{groupId}/metrics/overview")
    public ResponseEntity<SuccessResponse<GroupMetricsOverviewDTO>> overview(
            @Parameter(description = "Group ID") @PathVariable UUID groupId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Group metrics retrieved successfully",
                metricsService.overview(groupId, authentication.getName())));
    }

    @Operation(summary = "List per-assignment metrics of a group",
            description = "Returns delivery, punctuality, grade, attempt, and verdict metrics for each active assignment of an owned group, newest first.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Assignment metrics retrieved"),
            @ApiResponse(responseCode = "403", description = "Caller is not the group owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/api/groups/{groupId}/metrics/assignments")
    public ResponseEntity<SuccessResponse<List<AssignmentMetricsDTO>>> assignmentMetrics(
            @Parameter(description = "Group ID") @PathVariable UUID groupId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment metrics retrieved successfully",
                metricsService.assignmentMetrics(groupId, authentication.getName())));
    }

    @Operation(summary = "List per-student metrics of a group",
            description = "Returns completion, punctuality, score, and attempt metrics for each actively enrolled student, ordered by last name. Personal data is limited to id, full name, enrollment number, and join date.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Student metrics retrieved"),
            @ApiResponse(responseCode = "403", description = "Caller is not the group owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/api/groups/{groupId}/metrics/students")
    public ResponseEntity<SuccessResponse<List<StudentMetricsDTO>>> studentMetrics(
            @Parameter(description = "Group ID") @PathVariable UUID groupId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Student metrics retrieved successfully",
                metricsService.studentMetrics(groupId, authentication.getName())));
    }

    @Operation(summary = "Get detailed metrics of an assignment",
            description = "Returns the aggregate metrics of one active assignment plus language distribution, accepted-solution performance, missing students, and a per-student breakdown. PENDING verdicts mean the evaluation is still running.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Assignment metrics retrieved"),
            @ApiResponse(responseCode = "403", description = "Caller is not the group owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Assignment not found or logically deleted", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/api/assignments/{assignmentId}/metrics")
    public ResponseEntity<SuccessResponse<AssignmentMetricsDetailDTO>> assignmentDetail(
            @Parameter(description = "Assignment ID") @PathVariable UUID assignmentId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment metrics retrieved successfully",
                metricsService.assignmentDetail(assignmentId, authentication.getName())));
    }
}
