package com.github.codehive.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.EnrollmentDTO;
import com.github.codehive.model.dto.GroupDTO;
import com.github.codehive.model.request.group.CreateGroupRequest;
import com.github.codehive.model.request.group.JoinGroupRequest;
import com.github.codehive.model.request.group.UpdateGroupRequest;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.model.response.ErrorResponse;
import com.github.codehive.ratelimit.RateLimit;
import com.github.codehive.service.GroupService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/groups")
@Tag(name = "Groups", description = "Programming classroom group management")
public class GroupController {
    private final GroupService groupService;

    public GroupController(GroupService groupService) { this.groupService = groupService; }

    @Operation(summary = "Create a group", description = "Creates an owned group. Requires CREATE_GROUP; teachers receive this scope by default.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Group created"),
            @ApiResponse(responseCode = "400", description = "Invalid group data", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Missing CREATE_GROUP", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_GROUP')")
    public ResponseEntity<SuccessResponse<GroupDTO>> create(@Valid @RequestBody CreateGroupRequest request,
                                                            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new SuccessResponse<>(
                "Group created successfully", groupService.create(request, authentication.getName())));
    }

    @Operation(summary = "List accessible groups", description = "Returns groups owned by the caller plus active student enrollments. Deleted owned groups are optional.")
    @ApiResponse(responseCode = "200", description = "Groups retrieved")
    @GetMapping
    public ResponseEntity<SuccessResponse<List<GroupDTO>>> list(
            @RequestParam(defaultValue = "false") boolean includeDeleted, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Groups retrieved successfully",
                groupService.listMine(authentication.getName(), includeDeleted)));
    }

    @Operation(summary = "Get a group", description = "Returns an owned or actively enrolled group. Join codes are visible only to owners.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Group retrieved"),
            @ApiResponse(responseCode = "403", description = "Group is not accessible", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Group not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<SuccessResponse<GroupDTO>> get(@Parameter(description = "Group ID") @PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Group retrieved successfully",
                groupService.get(id, authentication.getName())));
    }

    @Operation(summary = "Update a group", description = "Updates an active, unarchived group owned by the caller.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Group updated"),
            @ApiResponse(responseCode = "400", description = "Group is archived or deleted", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Caller is not the owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}")
    public ResponseEntity<SuccessResponse<GroupDTO>> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest request, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Group updated successfully",
                groupService.update(id, request, authentication.getName())));
    }

    @Operation(summary = "Join a group", description = "Joins an active, unarchived group using its code. Only students may join and owners cannot join their own group.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Group joined"),
            @ApiResponse(responseCode = "400", description = "Group cannot be joined", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Join code not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many join attempts", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/join")
    @PreAuthorize("hasAuthority('STUDENT')")
    @RateLimit(limit = 10, duration = 60, message = "Too many group join attempts")
    public ResponseEntity<SuccessResponse<GroupDTO>> join(@Valid @RequestBody JoinGroupRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Joined group successfully",
                groupService.join(request.getJoinCode(), authentication.getName())));
    }

    @Operation(summary = "Leave a group", description = "Marks the authenticated student's active enrollment as LEFT.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Group left"),
            @ApiResponse(responseCode = "404", description = "Active enrollment not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/leave")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<SuccessResponse<Void>> leave(@PathVariable UUID id, Authentication authentication) {
        groupService.leave(id, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Left group successfully", null));
    }

    @Operation(summary = "List enrolled students", description = "Returns active enrollments for a group owned by the caller.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Students retrieved"),
            @ApiResponse(responseCode = "403", description = "Caller is not the owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/students")
    public ResponseEntity<SuccessResponse<List<EnrollmentDTO>>> students(@PathVariable UUID id,
                                                                         Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Students retrieved successfully",
                groupService.listStudents(id, authentication.getName())));
    }

    @Operation(summary = "Remove a student", description = "Marks an active enrollment as REMOVED. The caller must own the group.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Student removed"),
            @ApiResponse(responseCode = "403", description = "Caller is not the owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Active enrollment not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}/students/{studentId}")
    public ResponseEntity<SuccessResponse<Void>> removeStudent(@PathVariable UUID id, @PathVariable UUID studentId,
                                                               Authentication authentication) {
        groupService.removeStudent(id, studentId, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Student removed successfully", null));
    }

    @Operation(summary = "Archive a group", description = "Makes an owned active group read-only.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Group archived"), @ApiResponse(responseCode = "403", description = "Caller is not the owner")})
    @PostMapping("/{id}/archive")
    public ResponseEntity<SuccessResponse<GroupDTO>> archive(@PathVariable UUID id, Authentication authentication) {
        return stateResponse("Group archived successfully", groupService.setArchived(id, true, authentication.getName()));
    }

    @Operation(summary = "Unarchive a group", description = "Makes an owned active group writable again.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Group unarchived"), @ApiResponse(responseCode = "403", description = "Caller is not the owner")})
    @PostMapping("/{id}/unarchive")
    public ResponseEntity<SuccessResponse<GroupDTO>> unarchive(@PathVariable UUID id, Authentication authentication) {
        return stateResponse("Group unarchived successfully", groupService.setArchived(id, false, authentication.getName()));
    }

    @Operation(summary = "Delete a group", description = "Logically deletes and archives an owned group while preserving its history.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Group deleted"), @ApiResponse(responseCode = "403", description = "Caller is not the owner")})
    @DeleteMapping("/{id}")
    public ResponseEntity<SuccessResponse<Void>> delete(@PathVariable UUID id, Authentication authentication) {
        groupService.softDelete(id, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Group deleted logically", null));
    }

    @Operation(summary = "Restore a group", description = "Restores a logically deleted group in archived state.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Group restored"), @ApiResponse(responseCode = "403", description = "Caller is not the owner")})
    @PostMapping("/{id}/restore")
    public ResponseEntity<SuccessResponse<GroupDTO>> restore(@PathVariable UUID id, Authentication authentication) {
        return stateResponse("Group restored as archived", groupService.restore(id, authentication.getName()));
    }

    @Operation(summary = "Rotate a join code", description = "Replaces the join code of an active, unarchived group owned by the caller.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Join code rotated"),
            @ApiResponse(responseCode = "400", description = "Group is archived or deleted", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Caller is not the owner", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/join-code/rotate")
    public ResponseEntity<SuccessResponse<GroupDTO>> rotateJoinCode(@PathVariable UUID id,
                                                                    Authentication authentication) {
        return stateResponse("Join code rotated successfully",
                groupService.rotateJoinCode(id, authentication.getName()));
    }

    private ResponseEntity<SuccessResponse<GroupDTO>> stateResponse(String message, GroupDTO group) {
        return ResponseEntity.ok(new SuccessResponse<>(message, group));
    }
}
