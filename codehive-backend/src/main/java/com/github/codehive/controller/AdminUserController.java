package com.github.codehive.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.model.dto.admin.AdminAssignmentResourceDTO;
import com.github.codehive.model.dto.admin.AdminExecutionResourceDTO;
import com.github.codehive.model.dto.admin.AdminGroupResourceDTO;
import com.github.codehive.model.dto.admin.AdminSubmissionResourceDTO;
import com.github.codehive.model.dto.admin.AdminUserDetailDTO;
import com.github.codehive.model.dto.admin.AdminUserSummaryDTO;
import com.github.codehive.model.enums.AdminUserStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.request.admin.UpdateScopesRequest;
import com.github.codehive.model.request.admin.UpdateUserRequest;
import com.github.codehive.model.request.admin.UpdateUserRoleRequest;
import com.github.codehive.model.request.admin.UpdateUserStatusRequest;
import com.github.codehive.model.response.PageResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.AdminResourceService;
import com.github.codehive.service.AdminResourceService.AssignmentRelationship;
import com.github.codehive.service.AdminResourceService.GroupRelationship;
import com.github.codehive.service.AdminUserService;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('ADMIN')")
@Tag(name = "Admin Users", description = "Scoped user lifecycle and read-only resource inspection")
public class AdminUserController {
    private final AdminUserService userService;
    private final AdminResourceService resourceService;

    public AdminUserController(AdminUserService userService, AdminResourceService resourceService) {
        this.userService = userService;
        this.resourceService = resourceService;
    }

    @GetMapping
    @Operation(summary = "List visible users")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<PageResponse<AdminUserSummaryDTO>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) AdminUserStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        Page<AdminUserSummaryDTO> users = userService.list(search, role, status, page, size, sort, direction);
        return ResponseEntity.ok(new SuccessResponse<>("Users retrieved successfully", new PageResponse<>(users)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details and resource counts")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<AdminUserDetailDTO>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(new SuccessResponse<>("User retrieved successfully", userService.get(id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update user profile")
    public ResponseEntity<SuccessResponse<AdminUserDetailDTO>> update(
            @PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("User updated successfully",
                userService.update(id, request, authentication.getName())));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Change user role with conflict validation")
    public ResponseEntity<SuccessResponse<AdminUserDetailDTO>> updateRole(
            @PathVariable UUID id, @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("User role updated successfully",
                userService.updateRole(id, request, authentication.getName())));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Block, unblock, or delete user")
    public ResponseEntity<SuccessResponse<AdminUserDetailDTO>> updateStatus(
            @PathVariable UUID id, @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("User status updated successfully",
                userService.setStatus(id, request.status(), request.reason(), authentication.getName())));
    }

    @PatchMapping("/{id}/scopes")
    @Operation(summary = "Grant or revoke user scopes")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('MANAGE_SCOPES')")
    public ResponseEntity<SuccessResponse<AdminUserDetailDTO>> updateScopes(
            @PathVariable UUID id, @Valid @RequestBody UpdateScopesRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("User scopes updated successfully",
                userService.updateScopes(id, request, authentication.getName())));
    }

    @GetMapping("/{id}/groups")
    @Operation(summary = "List groups associated with user")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<PageResponse<AdminGroupResourceDTO>>> groups(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "OWNED") GroupRelationship relationship,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(new SuccessResponse<>("User groups retrieved successfully",
                new PageResponse<>(resourceService.groups(id, relationship, page, size))));
    }

    @GetMapping("/{id}/assignments")
    @Operation(summary = "List assignments associated with user")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<PageResponse<AdminAssignmentResourceDTO>>> assignments(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "AUTHORED") AssignmentRelationship relationship,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(new SuccessResponse<>("User assignments retrieved successfully",
                new PageResponse<>(resourceService.assignments(id, relationship, page, size))));
    }

    @GetMapping("/{id}/submissions")
    @Operation(summary = "List user submission metadata")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<PageResponse<AdminSubmissionResourceDTO>>> submissions(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(new SuccessResponse<>("User submissions retrieved successfully",
                new PageResponse<>(resourceService.submissions(id, page, size))));
    }

    @GetMapping("/{id}/executions")
    @Operation(summary = "List user execution metadata")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<PageResponse<AdminExecutionResourceDTO>>> executions(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(new SuccessResponse<>("User executions retrieved successfully",
                new PageResponse<>(resourceService.executions(id, page, size))));
    }
}
