package com.github.codehive.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.AssignmentFeedbackDTO;
import com.github.codehive.model.dto.AssignmentGradeDTO;
import com.github.codehive.model.dto.StudentAssignmentWorkDTO;
import com.github.codehive.model.request.assignment.CreateFeedbackRequest;
import com.github.codehive.model.request.assignment.GradeAssignmentRequest;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.AssignmentFeedbackService;
import com.github.codehive.service.AssignmentGradeService;
import com.github.codehive.service.StudentWorkQueryService;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/assignments")
@Tag(name = "Assignment Student Work", description = "Feedback, grade, and submission history APIs")
public class AssignmentStudentWorkController {
    private final AssignmentFeedbackService feedbackService;
    private final AssignmentGradeService gradeService;
    private final StudentWorkQueryService queryService;

    public AssignmentStudentWorkController(AssignmentFeedbackService feedbackService,
                                           AssignmentGradeService gradeService,
                                           StudentWorkQueryService queryService) {
        this.feedbackService = feedbackService;
        this.gradeService = gradeService;
        this.queryService = queryService;
    }

    @GetMapping("/{assignmentId}/student-work")
    @Operation(summary = "List assignment student work")
    @ApiResponse(responseCode = "200", description = "Student work retrieved")
    public ResponseEntity<SuccessResponse<List<StudentAssignmentWorkDTO>>> listStudentWork(
            @PathVariable UUID assignmentId, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Student work retrieved.",
                queryService.list(assignmentId, authentication.getName())));
    }

    @GetMapping("/{assignmentId}/students/{studentId}/work")
    @Operation(summary = "Get assignment work for one student")
    @ApiResponse(responseCode = "200", description = "Student work retrieved")
    public ResponseEntity<SuccessResponse<StudentAssignmentWorkDTO>> getStudentWork(
            @PathVariable UUID assignmentId, @PathVariable UUID studentId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Student work retrieved.",
                queryService.get(assignmentId, studentId, authentication.getName())));
    }

    @GetMapping("/{assignmentId}/my-work")
    @PreAuthorize("hasAuthority('STUDENT')")
    @Operation(summary = "Get the authenticated student's assignment work")
    @ApiResponse(responseCode = "200", description = "Student work retrieved")
    public ResponseEntity<SuccessResponse<StudentAssignmentWorkDTO>> myWork(
            @PathVariable UUID assignmentId, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Student work retrieved.",
                queryService.getMine(assignmentId, authentication.getName())));
    }

    @PostMapping("/{assignmentId}/students/{studentId}/feedback")
    @Operation(summary = "Publish assignment feedback for a student")
    @ApiResponse(responseCode = "200", description = "Feedback published")
    public ResponseEntity<SuccessResponse<AssignmentFeedbackDTO>> createFeedback(
            @PathVariable UUID assignmentId, @PathVariable UUID studentId,
            @Valid @RequestBody CreateFeedbackRequest request, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Feedback published.",
                feedbackService.create(assignmentId, studentId, request.body(), authentication.getName())));
    }

    @GetMapping("/{assignmentId}/students/{studentId}/feedback")
    @Operation(summary = "List feedback for a student's assignment work")
    @ApiResponse(responseCode = "200", description = "Feedback retrieved")
    public ResponseEntity<SuccessResponse<List<AssignmentFeedbackDTO>>> listFeedback(
            @PathVariable UUID assignmentId, @PathVariable UUID studentId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Feedback retrieved.",
                feedbackService.list(assignmentId, studentId, authentication.getName())));
    }

    @DeleteMapping("/feedback/{feedbackId}")
    @Operation(summary = "Logically delete assignment feedback")
    @ApiResponse(responseCode = "200", description = "Feedback deleted")
    public ResponseEntity<SuccessResponse<Void>> deleteFeedback(
            @PathVariable UUID feedbackId, Authentication authentication) {
        feedbackService.delete(feedbackId, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Feedback deleted.", null));
    }

    @PutMapping("/{assignmentId}/students/{studentId}/grade")
    @Operation(summary = "Create or replace a draft grade")
    @ApiResponse(responseCode = "200", description = "Draft grade saved")
    public ResponseEntity<SuccessResponse<AssignmentGradeDTO>> saveGrade(
            @PathVariable UUID assignmentId, @PathVariable UUID studentId,
            @Valid @RequestBody GradeAssignmentRequest request, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Draft grade saved.",
                gradeService.saveDraft(assignmentId, studentId, request.value(), authentication.getName())));
    }

    @PostMapping("/{assignmentId}/students/{studentId}/grade/return")
    @Operation(summary = "Return a draft grade to the student")
    @ApiResponse(responseCode = "200", description = "Grade returned")
    public ResponseEntity<SuccessResponse<AssignmentGradeDTO>> returnGrade(
            @PathVariable UUID assignmentId, @PathVariable UUID studentId,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Grade returned.",
                gradeService.returnGrade(assignmentId, studentId, authentication.getName())));
    }

    @GetMapping("/{assignmentId}/my-grade")
    @PreAuthorize("hasAuthority('STUDENT')")
    @Operation(summary = "Get the authenticated student's returned grade")
    @ApiResponse(responseCode = "200", description = "Grade retrieved")
    public ResponseEntity<SuccessResponse<AssignmentGradeDTO>> myGrade(
            @PathVariable UUID assignmentId, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Grade retrieved.",
                gradeService.getForStudent(assignmentId,
                        authentication.getName())));
    }
}
