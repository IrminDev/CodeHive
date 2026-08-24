package com.github.codehive.controller;

import java.time.Instant;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.admin.AdminAuditEventDTO;
import com.github.codehive.model.dto.admin.AdminStatisticsDTO;
import com.github.codehive.model.dto.admin.RateLimitIncidentDTO;
import com.github.codehive.model.enums.AdminAuditAction;
import com.github.codehive.model.enums.AdminAuditOutcome;
import com.github.codehive.model.response.PageResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.AdminAuditService;
import com.github.codehive.service.AdminStatisticsService;
import com.github.codehive.service.RateLimitIncidentService;
import com.github.codehive.ratelimit.RateLimit;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
@Tag(name = "Admin Monitoring", description = "Operational statistics, incidents, and audit history")
public class AdminMonitoringController {
    private final AdminStatisticsService statisticsService;
    private final RateLimitIncidentService incidentService;
    private final AdminAuditService auditService;

    public AdminMonitoringController(AdminStatisticsService statisticsService,
                                     RateLimitIncidentService incidentService,
                                     AdminAuditService auditService) {
        this.statisticsService = statisticsService;
        this.incidentService = incidentService;
        this.auditService = auditService;
    }

    @GetMapping("/statistics")
    @Operation(summary = "Get operational admin statistics")
    @RateLimit(key = "admin.statistics", limit = 30, duration = 60,
            message = "Too many statistics requests")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('CHECK_ANALYTICS')")
    public ResponseEntity<SuccessResponse<AdminStatisticsDTO>> statistics(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(new SuccessResponse<>("Admin statistics retrieved successfully",
                statisticsService.get(from, to)));
    }

    @GetMapping("/rate-limit-incidents")
    @Operation(summary = "List authenticated rate-limit incidents")
    @RateLimit(key = "admin.rate-limit-incidents", limit = 30, duration = 60,
            message = "Too many incident queries")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<PageResponse<RateLimitIncidentDTO>>> incidents(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String policy,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String endpoint,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(new SuccessResponse<>("Rate-limit incidents retrieved successfully",
                new PageResponse<>(incidentService.list(userId, policy, method, endpoint, from, to, page, size))));
    }

    @GetMapping("/audit-events")
    @Operation(summary = "List administrative audit events")
    @RateLimit(key = "admin.audit-events", limit = 30, duration = 60,
            message = "Too many audit queries")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_AUDIT_LOG')")
    public ResponseEntity<SuccessResponse<PageResponse<AdminAuditEventDTO>>> auditEvents(
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) AdminAuditAction action,
            @RequestParam(required = false) AdminAuditOutcome outcome,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(new SuccessResponse<>("Audit events retrieved successfully",
                new PageResponse<>(auditService.list(actorId, targetId, action, outcome, from, to, page, size))));
    }
}
