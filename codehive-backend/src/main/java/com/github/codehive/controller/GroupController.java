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
import com.github.codehive.ratelimit.RateLimit;
import com.github.codehive.service.GroupService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/groups")
@Tag(name = "Groups", description = "Programming classroom group management")
public class GroupController {
    private final GroupService groupService;

    public GroupController(GroupService groupService) { this.groupService = groupService; }

    @PostMapping
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<GroupDTO>> create(@Valid @RequestBody CreateGroupRequest request,
                                                            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new SuccessResponse<>(
                "Group created successfully", groupService.create(request, authentication.getName())));
    }

    @GetMapping
    public ResponseEntity<SuccessResponse<List<GroupDTO>>> list(
            @RequestParam(defaultValue = "false") boolean includeDeleted, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Groups retrieved successfully",
                groupService.listMine(authentication.getName(), includeDeleted)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuccessResponse<GroupDTO>> get(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Group retrieved successfully",
                groupService.get(id, authentication.getName())));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<GroupDTO>> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest request, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Group updated successfully",
                groupService.update(id, request, authentication.getName())));
    }

    @PostMapping("/join")
    @PreAuthorize("hasAuthority('STUDENT')")
    @RateLimit(limit = 10, duration = 60, message = "Too many group join attempts")
    public ResponseEntity<SuccessResponse<GroupDTO>> join(@Valid @RequestBody JoinGroupRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Joined group successfully",
                groupService.join(request.getJoinCode(), authentication.getName())));
    }

    @PostMapping("/{id}/leave")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<SuccessResponse<Void>> leave(@PathVariable UUID id, Authentication authentication) {
        groupService.leave(id, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Left group successfully", null));
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<List<EnrollmentDTO>>> students(@PathVariable UUID id,
                                                                         Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("Students retrieved successfully",
                groupService.listStudents(id, authentication.getName())));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<Void>> removeStudent(@PathVariable UUID id, @PathVariable UUID studentId,
                                                               Authentication authentication) {
        groupService.removeStudent(id, studentId, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Student removed successfully", null));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<GroupDTO>> archive(@PathVariable UUID id, Authentication authentication) {
        return stateResponse("Group archived successfully", groupService.setArchived(id, true, authentication.getName()));
    }

    @PostMapping("/{id}/unarchive")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<GroupDTO>> unarchive(@PathVariable UUID id, Authentication authentication) {
        return stateResponse("Group unarchived successfully", groupService.setArchived(id, false, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<Void>> delete(@PathVariable UUID id, Authentication authentication) {
        groupService.softDelete(id, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("Group deleted logically", null));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<GroupDTO>> restore(@PathVariable UUID id, Authentication authentication) {
        return stateResponse("Group restored as archived", groupService.restore(id, authentication.getName()));
    }

    @PostMapping("/{id}/join-code/rotate")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<SuccessResponse<GroupDTO>> rotateJoinCode(@PathVariable UUID id,
                                                                    Authentication authentication) {
        return stateResponse("Join code rotated successfully",
                groupService.rotateJoinCode(id, authentication.getName()));
    }

    private ResponseEntity<SuccessResponse<GroupDTO>> stateResponse(String message, GroupDTO group) {
        return ResponseEntity.ok(new SuccessResponse<>(message, group));
    }
}
