package com.github.codehive.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.github.codehive.model.dto.AssignmentDTO;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.model.response.ErrorResponse;
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

    @Operation(
        summary = "Create a new assignment",
        description = "Teacher uploads assignment metadata, a reference solution, and test case input files. " +
                      "The assignment is created as inactive. The worker runs the reference solution against each " +
                      "input to generate expected outputs, then activates the assignment."
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
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SuccessResponse<AssignmentDTO>> createAssignment(
            @Valid @RequestPart("metadata") CreateAssignmentRequest metadata,
            @RequestPart("referenceSolution") MultipartFile referenceSolution,
            @RequestPart("testCaseInputs") List<MultipartFile> testCaseInputs) {

        logger.info("POST /api/assignments - title={}, language={}, testCases={}",
                metadata.getTitle(), metadata.getReferenceLanguage(), testCaseInputs.size());

        if (testCaseInputs.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        AssignmentDTO created = assignmentService.createAssignment(metadata, referenceSolution, testCaseInputs);

        logger.info("Assignment queued for test generation: id={}", created.getId());

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(new SuccessResponse<>("Assignment created. Test output generation in progress.", created));
    }
}
