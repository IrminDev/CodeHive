package com.github.codehive.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.github.codehive.model.dto.AssignmentDTO;
import com.github.codehive.model.dto.AssignmentManagementStatusDTO;
import com.github.codehive.model.dto.AssignmentUpdateDTO;
import com.github.codehive.model.dto.CloneAssignmentFormDTO;
import com.github.codehive.model.dto.AssignmentPreviewDTO;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.model.request.assignment.CloneAssignmentRequest;
import com.github.codehive.model.request.assignment.UpdateAssignmentRequest;
import com.github.codehive.model.response.ErrorResponse;
import com.github.codehive.model.response.PageResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.AssignmentService;
import com.github.codehive.service.AssignmentUpdateService;
import com.github.codehive.service.TeacherAssignmentStatusService;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.AssignmentUpdateStatus;
import com.github.codehive.ratelimit.RateLimit;

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
    private final AssignmentUpdateService assignmentUpdateService;
    private final TeacherAssignmentStatusService teacherAssignmentStatusService;

    public AssignmentController(AssignmentService assignmentService,
                                AssignmentUpdateService assignmentUpdateService,
                                TeacherAssignmentStatusService teacherAssignmentStatusService) {
        this.assignmentService = assignmentService;
        this.assignmentUpdateService = assignmentUpdateService;
        this.teacherAssignmentStatusService = teacherAssignmentStatusService;
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RateLimit(key = "assignments.update", limit = 10, duration = 60,
            message = "Too many assignment updates")
    @Operation(summary = "Update assignment metadata, reference solution, or test suite")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Metadata updated immediately"),
            @ApiResponse(responseCode = "202", description = "Reference or test changes queued for validation")
    })
    public ResponseEntity<SuccessResponse<AssignmentUpdateDTO>> updateAssignment(
            @PathVariable UUID id,
            @Valid @RequestPart("metadata") UpdateAssignmentRequest metadata,
            @RequestPart(value = "referenceSolution", required = false) MultipartFile referenceSolution,
            @RequestPart(value = "testCaseInputs", required = false) List<MultipartFile> testCaseInputs,
            Authentication authentication) {
        AssignmentUpdateDTO update = assignmentUpdateService.update(
                id, metadata, referenceSolution, testCaseInputs, authentication.getName());
        HttpStatus status = update.status() == AssignmentUpdateStatus.VALIDATING
                ? HttpStatus.ACCEPTED : HttpStatus.OK;
        return ResponseEntity.status(status).body(new SuccessResponse<>(
                update.status() == AssignmentUpdateStatus.VALIDATING
                        ? "Assignment update is being validated."
                        : "Assignment updated successfully.",
                update));
    }

    @GetMapping("/updates/{updateId}")
    @Operation(summary = "Get staged assignment update status")
    @ApiResponse(responseCode = "200", description = "Assignment update retrieved")
    public ResponseEntity<SuccessResponse<AssignmentUpdateDTO>> getAssignmentUpdate(
            @PathVariable UUID updateId, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment update retrieved.",
                assignmentUpdateService.get(updateId, authentication.getName())));
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
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(defaultValue = "false") boolean deletedOnly,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) AssignmentValidationStatus validationStatus,
            Authentication authentication) {
        Page<AssignmentDTO> result = assignmentService.listGroupAssignments(
                groupId, page, size, authentication.getName(), includeDeleted,
                deletedOnly, query, validationStatus);
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
            description = "Forbidden — caller does not own the target group",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class))
        )
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RateLimit(key = "assignments.create", limit = 5, duration = 60,
            message = "Too many assignment creation requests")
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

    @Operation(summary = "Get assignment clone form",
            description = "Returns every editable source field, reference solution, and test input. Scheduling dates are intentionally omitted.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Clone form retrieved"),
            @ApiResponse(responseCode = "403", description = "Caller does not own the source assignment", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Assignment not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/clone-form")
    @RateLimit(key = "assignments.clone-form", limit = 20, duration = 60,
            message = "Too many assignment artifact requests")
    public ResponseEntity<SuccessResponse<CloneAssignmentFormDTO>> getCloneForm(
            @PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment clone form retrieved.",
                assignmentService.getCloneForm(id, authentication.getName())));
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Get owner-only assignment preview with generated outputs")
    public ResponseEntity<SuccessResponse<AssignmentPreviewDTO>> getPreview(
            @PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment preview retrieved.",
                assignmentService.getTeacherPreview(id, authentication.getName())));
    }

    @Operation(summary = "Clone an assignment",
            description = "Creates a clone from the teacher-edited form snapshot in another owned, active, writable group and queues expected-output generation.")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Assignment cloned and generation queued"),
            @ApiResponse(responseCode = "400", description = "Invalid target group or dates", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Caller does not own the source or target group", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Assignment or group not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/clone")
    @RateLimit(key = "assignments.clone", limit = 5, duration = 60,
            message = "Too many assignment clone requests")
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
    public ResponseEntity<SuccessResponse<Void>> deleteAssignment(@PathVariable UUID id,
                                                                   Authentication authentication) {
        assignmentService.softDelete(id, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Assignment deleted logically", null));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore a logically deleted assignment")
    public ResponseEntity<SuccessResponse<AssignmentDTO>> restoreAssignment(
            @PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment restored.",
                assignmentService.restore(id, authentication.getName())));
    }

    @GetMapping("/{id}/management-status")
    @Operation(summary = "Get owner-only validation, update, and reevaluation status")
    public ResponseEntity<SuccessResponse<AssignmentManagementStatusDTO>> managementStatus(
            @PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Assignment management status retrieved.",
                teacherAssignmentStatusService.get(id, authentication.getName())));
    }
}
