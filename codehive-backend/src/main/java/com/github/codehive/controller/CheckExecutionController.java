package com.github.codehive.controller;

import com.github.codehive.model.dto.ExecutionDTO;
import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.request.execution.ExecutionRequest;
import com.github.codehive.model.response.ErrorResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.ratelimit.RateLimit;
import com.github.codehive.service.ExecutionRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

/**
 * Controller for code execution endpoints.
 * Allows submitting code for execution and checking execution status.
 */
@RestController
@RequestMapping("/api/execution")
@Tag(
    name = "Code Execution",
    description = "Code execution and result checking APIs"
)
public class CheckExecutionController {
    private final ExecutionRequestService executionRequestService;

    public CheckExecutionController(
        ExecutionRequestService executionRequestService
    ) {
        this.executionRequestService = executionRequestService;
    }

    @Operation(
        summary = "Submit code for execution",
        description = "Submits code to be executed in a sandboxed environment. Returns execution ID for status polling."
    )
    @ApiResponses(
        value = {
            @ApiResponse(
                responseCode = "202",
                description = "Execution request accepted",
                content = @Content(
                    schema = @Schema(implementation = SuccessResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Validation error",
                content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "429",
                description = "Too many requests",
                content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @RateLimit(
        limit = 10,
        duration = 60,
        message = "Too many execution requests. Please try again in 1 minute."
    )
    @PostMapping("/check")
    public ResponseEntity<SuccessResponse<ExecutionDTO>> submitExecution(
        @Valid @RequestBody ExecutionRequest request,
        Authentication authentication
    ) {
        ExecutionDTO execution = executionRequestService.requestExecution(
            request, authentication.getName()
        );

        SuccessResponse<ExecutionDTO> response = new SuccessResponse<>(
            "Execution request submitted successfully",
            execution
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @Operation(
        summary = "Get execution status",
        description = "Retrieves the current status and results of a code execution by its ID."
    )
    @ApiResponses(
        value = {
            @ApiResponse(
                responseCode = "200",
                description = "Execution found",
                content = @Content(
                    schema = @Schema(implementation = SuccessResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "404",
                description = "Execution not found",
                content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @GetMapping("/check/{id}")
    public ResponseEntity<SuccessResponse<ExecutionDTO>> getExecution(
        @Parameter(
            description = "Execution ID",
            required = true
        ) @PathVariable UUID id
        , Authentication authentication
    ) {
        ExecutionDTO execution = executionRequestService.getExecutionById(id, authentication.getName());
        SuccessResponse<ExecutionDTO> response = new SuccessResponse<>(
            "Execution retrieved successfully",
            execution
        );
        return ResponseEntity.ok(response);
    }

    @Operation(
        summary = "Get execution report",
        description = "Retrieves the full execution report from object storage, including per-test-case results, timing, memory, and feedback."
    )
    @ApiResponses(
        value = {
            @ApiResponse(
                responseCode = "200",
                description = "Report retrieved successfully",
                content = @Content(
                    schema = @Schema(implementation = SuccessResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "404",
                description = "Execution not found or report not available yet",
                content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "410",
                description = "Execution report artifacts expired",
                content = @Content(
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @GetMapping("/check/{id}/report")
    public ResponseEntity<SuccessResponse<ExecutionReport>> getExecutionReport(
        @Parameter(
            description = "Execution ID",
            required = true
        ) @PathVariable UUID id
        , Authentication authentication
    ) {
        ExecutionReport report = executionRequestService.getExecutionReport(id, authentication.getName());
        SuccessResponse<ExecutionReport> response = new SuccessResponse<>(
            "Execution report retrieved successfully",
            report
        );
        return ResponseEntity.ok(response);
    }
}
