package com.github.codehive.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.github.codehive.model.dto.AssignmentDTO;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.model.request.assignment.CloneAssignmentRequest;
import com.github.codehive.model.response.ErrorResponse;
import com.github.codehive.model.response.PageResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.AssignmentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/assignments")
@Tag(name = "Assignments", description = "Assignment management APIs")
public class AssignmentController {
    private static final Logger logger = LoggerFactory.getLogger(AssignmentController.class);

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @Operation(summary = "List assignments (paginated)",
            description = "Returns a page of assignments ordered by creation date descending.")
    @ApiResponse(responseCode = "200", description = "Assignments retrieved successfully",
            content = @Content(schema = @Schema(implementation = SuccessResponse.class)))
    @GetMapping
    public ResponseEntity<SuccessResponse<PageResponse<AssignmentDTO>>> listAssignments(
            @RequestParam UUID groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Page<AssignmentDTO> result = assignmentService.listGroupAssignments(
                groupId, page, size, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Assignments retrieved successfully.", new PageResponse<>(result)));
    }

    @Operation(summary = "Get assignment by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Assignment retrieved successfully",
                content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
        @ApiResponse(responseCode = "404", description = "Assignment not found",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<SuccessResponse<AssignmentDTO>> getAssignment(@PathVariable UUID id,
                                                                         Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment retrieved successfully.",
                assignmentService.getAssignmentById(id, authentication.getName())));
    }

    @Operation(
        summary = "Create a new assignment",
        description = "Teacher uploads assignment metadata, a reference solution, and test case input files. " +
                      "The assignment is active with validation status PROCESSING while the worker generates expected outputs. " +
                      "It becomes student-visible only after validation reaches READY and its launch date has arrived."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "202",
            description = "Assignment created and test generation queued",
            content = @Content(schema = @Schema(implementation = SuccessResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Validation error or missing files",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class))
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden — only TEACHER or ADMIN role allowed",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class))
        )
    })
    @PreAuthorize("hasAnyAuthority('TEACHER', 'ADMIN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SuccessResponse<AssignmentDTO>> createAssignment(
            @Valid @RequestPart("metadata") CreateAssignmentRequest metadata,
            @RequestPart("referenceSolution") MultipartFile referenceSolution,
            @RequestPart("testCaseInputs") List<MultipartFile> testCaseInputs,
            Authentication authentication) {

        logger.info("POST /api/assignments - title={}, language={}, testCases={}",
                metadata.getTitle(), metadata.getReferenceLanguage(), testCaseInputs.size());

        if (testCaseInputs.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        AssignmentDTO created = assignmentService.createAssignment(
                metadata, referenceSolution, testCaseInputs, authentication.getName());

        logger.info("Assignment queued for test generation: id={}", created.getId());

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(new SuccessResponse<>("Assignment created. Test output generation in progress.", created));
    }

    @Operation(summary = "Clone an assignment", description = "Clones an owned assignment into another owned, writable group and queues expected-output generation.")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Assignment cloned and generation queued"),
            @ApiResponse(responseCode = "400", description = "Invalid target group or dates", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Caller does not own the source or target group", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Assignment or group not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/clone")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<AssignmentDTO>> cloneAssignment(
            @PathVariable UUID id, @Valid @RequestBody CloneAssignmentRequest request,
            Authentication authentication) {
        AssignmentDTO clone = assignmentService.cloneAssignment(id, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new SuccessResponse<>(
                "Assignment cloned. Test output generation in progress.", clone));
    }

    @Operation(summary = "Delete an assignment", description = "Logically deletes an assignment owned by the caller's group.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Assignment deleted"),
            @ApiResponse(responseCode = "403", description = "Caller does not own the assignment", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Assignment not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<Void>> deleteAssignment(@PathVariable UUID id,
                                                                   Authentication authentication) {
        assignmentService.softDelete(id, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Assignment deleted logically", null));
    }
}
