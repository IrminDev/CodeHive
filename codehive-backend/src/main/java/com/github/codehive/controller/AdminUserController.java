package com.github.codehive.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
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

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.request.admin.UpdateScopesRequest;
import com.github.codehive.model.request.admin.UpdateUserRequest;
import com.github.codehive.model.response.ErrorResponse;
import com.github.codehive.model.response.PageResponse;
import com.github.codehive.model.response.SuccessResponse;
import com.github.codehive.service.AdminUserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('ADMIN')")
@Tag(name = "Admin Users", description = "Scoped user and administrator management")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @Operation(summary = "List users", description = "Returns users ordered by creation date descending. Requires VIEW_USERS.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Users retrieved"),
            @ApiResponse(responseCode = "403", description = "Missing admin role or scope", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<PageResponse<UserDTO>>> list(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        Page<UserDTO> users = adminUserService.list(role, active, page, size);
        return ResponseEntity.ok(new SuccessResponse<>("Users retrieved successfully", new PageResponse<>(users)));
    }

    @Operation(summary = "Get user", description = "Returns one user. Requires VIEW_USERS.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User retrieved"),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('VIEW_USERS')")
    public ResponseEntity<SuccessResponse<UserDTO>> get(@Parameter(description = "User ID") @PathVariable UUID id) {
        return ResponseEntity.ok(new SuccessResponse<>("User retrieved successfully", adminUserService.get(id)));
    }

    @Operation(summary = "Update user", description = "Updates profile fields without changing the role. The required scope depends on the target role.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated"),
            @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permission", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email or enrollment number already exists", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('ADMIN') and hasAnyAuthority('UPDATE_USERS', 'UPDATE_ADMINS')")
    @PatchMapping("/{id}")
    public ResponseEntity<SuccessResponse<UserDTO>> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("User updated successfully",
                adminUserService.update(id, request, authentication.getName())));
    }

    @Operation(summary = "Deactivate user", description = "Soft-deactivates an account and preserves its academic history.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User deactivated"),
            @ApiResponse(responseCode = "403", description = "Insufficient permission", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('ADMIN') and hasAnyAuthority('MANAGE_USER_STATUS', 'MANAGE_ADMIN_STATUS')")
    @DeleteMapping("/{id}")
    public ResponseEntity<SuccessResponse<Void>> deactivate(@PathVariable UUID id, Authentication authentication) {
        adminUserService.setActive(id, false, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("User deactivated successfully", null));
    }

    @Operation(summary = "Restore user", description = "Reactivates a previously deactivated account.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User restored"),
            @ApiResponse(responseCode = "403", description = "Insufficient permission", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PreAuthorize("hasAuthority('ADMIN') and hasAnyAuthority('MANAGE_USER_STATUS', 'MANAGE_ADMIN_STATUS')")
    @PostMapping("/{id}/restore")
    public ResponseEntity<SuccessResponse<Void>> restore(@PathVariable UUID id, Authentication authentication) {
        adminUserService.setActive(id, true, authentication.getName());
        return ResponseEntity.ok(new SuccessResponse<>("User restored successfully", null));
    }

    @Operation(summary = "Grant or revoke scopes", description = "Applies disjoint grant and revoke sets with escalation safeguards. Requires MANAGE_SCOPES.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Scopes updated"),
            @ApiResponse(responseCode = "400", description = "Invalid scope change", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Insufficient permission", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}/scopes")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('MANAGE_SCOPES')")
    public ResponseEntity<SuccessResponse<UserDTO>> updateScopes(@PathVariable UUID id,
            @Valid @RequestBody UpdateScopesRequest request, Authentication authentication) {
        return ResponseEntity.ok(new SuccessResponse<>("User scopes updated successfully",
                adminUserService.updateScopes(id, request, authentication.getName())));
    }
}
