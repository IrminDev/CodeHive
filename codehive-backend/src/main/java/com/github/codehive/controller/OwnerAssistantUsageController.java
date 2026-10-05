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
@io.swagger.v3.oas.annotations.tags.Tag(name = "OwnerAssistantUsage", description = "Content-free assistant usage, historical ledger counts and measured provider work")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Usage retrieved"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid dates, page or filter"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Caller lacks ownership, role or required scope"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Requested resource not found")
})
@RestController
public class OwnerAssistantUsageController {
    private final AssistantUsageService usage;
    public OwnerAssistantUsageController(AssistantUsageService usage) { this.usage=usage; }
    @GetMapping("/api/groups/{groupId}/assistant-usage")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get owned group AI usage")
    public SuccessResponse<Summary> groupSummary(@PathVariable UUID groupId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.OWNER,auth.getName(),null,groupId,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.summary(access));
    }
    @GetMapping("/api/groups/{groupId}/assistant-usage/assignments")
    @io.swagger.v3.oas.annotations.Operation(summary = "List AI usage by assignment in owned group")
    public SuccessResponse<Breakdown> groupAssignments(@PathVariable UUID groupId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.OWNER,auth.getName(),null,groupId,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.ASSIGNMENTS,query));
    }
    @GetMapping("/api/groups/{groupId}/assistant-usage/students")
    @io.swagger.v3.oas.annotations.Operation(summary = "List AI usage by student in owned group")
    public SuccessResponse<Breakdown> groupStudents(@PathVariable UUID groupId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.OWNER,auth.getName(),null,groupId,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.STUDENTS,query));
    }
    @GetMapping("/api/assignments/{assignmentId}/assistant-usage")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get owned assignment AI usage")
    public SuccessResponse<Summary> assignmentSummary(@PathVariable UUID assignmentId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.OWNER,auth.getName(),null,null,assignmentId,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.summary(access));
    }
    @GetMapping("/api/assignments/{assignmentId}/assistant-usage/students")
    @io.swagger.v3.oas.annotations.Operation(summary = "List student AI usage and lifetime quota for owned assignment")
    public SuccessResponse<Breakdown> assignmentStudents(@PathVariable UUID assignmentId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.OWNER,auth.getName(),null,null,assignmentId,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.STUDENTS,query));
    }
    @GetMapping("/api/assistant-usage/owned-groups")
    @io.swagger.v3.oas.annotations.Operation(summary = "List owned groups including archived and logically deleted groups")
    public SuccessResponse<java.util.List<GroupOption>> groups(Authentication auth) {
        return new SuccessResponse<>("Owned groups retrieved",usage.ownedGroups(auth.getName()));
    }
}
