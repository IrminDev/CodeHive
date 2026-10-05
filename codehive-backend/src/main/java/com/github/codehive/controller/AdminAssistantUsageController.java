package com.github.codehive.controller;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import com.github.codehive.service.assistant.AssistantUsageService;
import com.github.codehive.service.assistant.AssistantUsageService.Audience;
import com.github.codehive.repository.AssistantUsageRepository.Dimension;
import com.github.codehive.model.request.assistant.AssistantUsageQuery;
import com.github.codehive.model.dto.assistant.usage.AssistantUsageDTO.*;
import com.github.codehive.model.response.SuccessResponse;
@io.swagger.v3.oas.annotations.tags.Tag(name = "AdminAssistantUsage", description = "Content-free assistant usage, historical ledger counts and measured provider work")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Usage retrieved"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid dates, page or filter"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Caller lacks ownership, role or required scope"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Requested resource not found")
})
@RestController
@PreAuthorize("hasAuthority('ADMIN') and hasAuthority('CHECK_ANALYTICS')")
public class AdminAssistantUsageController {
    private final AssistantUsageService usage;
    public AdminAssistantUsageController(AssistantUsageService usage) { this.usage=usage; }
    @GetMapping("/api/admin/assistant-usage")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get global AI usage")
    public SuccessResponse<Summary> summary(@org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.ADMIN,auth.getName(),null,null,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.summary(access));
    }
    @GetMapping("/api/admin/assistant-usage/users")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('CHECK_ANALYTICS') and hasAuthority('VIEW_USERS')")
    @io.swagger.v3.oas.annotations.Operation(summary = "List AI usage by user")
    public SuccessResponse<Breakdown> users(@org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.ADMIN,auth.getName(),null,null,null,query,true);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.USERS,query));
    }
    @GetMapping("/api/admin/users/{userId}/assistant-usage")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('CHECK_ANALYTICS') and hasAuthority('VIEW_USERS')")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get user AI usage")
    public SuccessResponse<Summary> userSummary(@PathVariable UUID userId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.ADMIN,auth.getName(),userId,null,null,query,true);
        return new SuccessResponse<>("Assistant usage retrieved",usage.summary(access));
    }
    @GetMapping("/api/admin/users/{userId}/assistant-usage/groups")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('CHECK_ANALYTICS') and hasAuthority('VIEW_USERS')")
    @io.swagger.v3.oas.annotations.Operation(summary = "List user AI usage by group")
    public SuccessResponse<Breakdown> userGroups(@PathVariable UUID userId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.ADMIN,auth.getName(),userId,null,null,query,true);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.GROUPS,query));
    }
    @GetMapping("/api/admin/users/{userId}/assistant-usage/groups/{groupId}/assignments")
    @PreAuthorize("hasAuthority('ADMIN') and hasAuthority('CHECK_ANALYTICS') and hasAuthority('VIEW_USERS')")
    @io.swagger.v3.oas.annotations.Operation(summary = "List user AI usage and quota by assignment")
    public SuccessResponse<Breakdown> userAssignments(@PathVariable UUID userId, @PathVariable UUID groupId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.ADMIN,auth.getName(),userId,groupId,null,query,true);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.ASSIGNMENTS,query));
    }
    @GetMapping("/api/admin/assistant-usage/models")
    @io.swagger.v3.oas.annotations.Operation(summary = "List measured provider model and stage usage")
    public SuccessResponse<Models> models(@org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.ADMIN,auth.getName(),null,null,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.models(access));
    }
}
