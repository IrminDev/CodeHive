package com.github.codehive.controller;

import java.util.UUID;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.model.dto.RecentSubmissionDTO;
import com.github.codehive.model.dto.StudentGroupSubmissionDTO;
import com.github.codehive.model.dto.StudentSubmissionHistoryDTO;
import com.github.codehive.service.SubmissionLifecycleService;
import com.github.codehive.service.StudentSubmissionQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/submissions")
@Tag(name = "Submissions", description = "Submission lifecycle APIs")
public class SubmissionController {
    private final SubmissionLifecycleService submissionLifecycleService;
    private final StudentSubmissionQueryService studentSubmissionQueryService;

    public SubmissionController(SubmissionLifecycleService submissionLifecycleService,
                                StudentSubmissionQueryService studentSubmissionQueryService) {
        this.submissionLifecycleService = submissionLifecycleService;
        this.studentSubmissionQueryService = studentSubmissionQueryService;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('STUDENT')")
    @Operation(summary = "List the authenticated student's recent submissions")
    @ApiResponse(responseCode = "200", description = "Recent submissions retrieved")
    public ResponseEntity<SuccessResponse<List<RecentSubmissionDTO>>> listMine(
            @RequestParam(defaultValue = "5") int limit, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Recent submissions retrieved.",
                studentSubmissionQueryService.listRecent(authentication.getName(), limit)));
    }

    @GetMapping("/mine/group/{groupId}")
    @PreAuthorize("hasAuthority('STUDENT')")
    @Operation(summary = "List the authenticated student's current submissions for one group")
    @ApiResponse(responseCode = "200", description = "Group submission statuses retrieved")
    public ResponseEntity<SuccessResponse<List<StudentGroupSubmissionDTO>>> listMineForGroup(
            @PathVariable UUID groupId, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Group submission statuses retrieved.",
                studentSubmissionQueryService.listGroupSubmissions(groupId, authentication.getName())));
    }

    @GetMapping("/mine/assignment/{assignmentId}")
    @PreAuthorize("hasAuthority('STUDENT')")
    @Operation(summary = "List the authenticated student's submission history for one assignment")
    @ApiResponse(responseCode = "200", description = "Assignment submission history retrieved")
    public ResponseEntity<SuccessResponse<List<StudentSubmissionHistoryDTO>>> listMineForAssignment(
            @PathVariable UUID assignmentId, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment submission history retrieved.",
                studentSubmissionQueryService.listAssignmentHistory(
                        assignmentId, authentication.getName())));
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
