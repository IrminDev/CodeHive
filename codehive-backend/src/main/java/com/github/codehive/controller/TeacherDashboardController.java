package com.github.codehive.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.TeacherDashboardDTO;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.TeacherDashboardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/teacher")
@Tag(name = "Teacher Dashboard", description = "Teacher action-center APIs")
public class TeacherDashboardController {
    private final TeacherDashboardService dashboardService;

    public TeacherDashboardController(TeacherDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get teacher dashboard action center")
    public ResponseEntity<SuccessResponse<TeacherDashboardDTO>> dashboard(Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Teacher dashboard retrieved.",
                dashboardService.get(authentication.getName())));
    }
}
