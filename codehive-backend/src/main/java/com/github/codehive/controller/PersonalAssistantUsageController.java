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
@io.swagger.v3.oas.annotations.tags.Tag(name = "PersonalAssistantUsage", description = "Content-free assistant usage, historical ledger counts and measured provider work")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Usage retrieved"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid dates, page or filter"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Caller lacks ownership, role or required scope"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Requested resource not found")
})
@RestController
@PreAuthorize("hasAuthority('STUDENT')")
public class PersonalAssistantUsageController {
    private final AssistantUsageService usage;
    public PersonalAssistantUsageController(AssistantUsageService usage) { this.usage=usage; }
    @GetMapping("/api/assistant-usage/me")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get my AI usage")
    public SuccessResponse<Summary> summary(@org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.PERSONAL,auth.getName(),null,null,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.summary(access));
    }
    @GetMapping("/api/assistant-usage/me/groups")
    @io.swagger.v3.oas.annotations.Operation(summary = "List my AI usage by group")
    public SuccessResponse<Breakdown> groups(@org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.PERSONAL,auth.getName(),null,null,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.GROUPS,query));
    }
    @GetMapping("/api/assistant-usage/me/groups/{groupId}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get my historical group AI usage")
    public SuccessResponse<Summary> groupSummary(@PathVariable UUID groupId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.PERSONAL,auth.getName(),null,groupId,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.summary(access));
    }
    @GetMapping("/api/assistant-usage/me/groups/{groupId}/assignments")
    @io.swagger.v3.oas.annotations.Operation(summary = "List my assignment AI usage and lifetime quota")
    public SuccessResponse<Breakdown> assignments(@PathVariable UUID groupId, @org.springdoc.core.annotations.ParameterObject @ModelAttribute AssistantUsageQuery query, Authentication auth) {
        var access=usage.authorize(Audience.PERSONAL,auth.getName(),null,groupId,null,query,false);
        return new SuccessResponse<>("Assistant usage retrieved",usage.rows(access,Dimension.ASSIGNMENTS,query));
    }
}
