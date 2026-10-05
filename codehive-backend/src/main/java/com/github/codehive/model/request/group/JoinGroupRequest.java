package com.github.codehive.model.request.group;

import jakarta.validation.constraints.NotBlank;

public class JoinGroupRequest {
    @NotBlank(message = "Join code is required")
    private String joinCode;

    public String getJoinCode() { return joinCode; }
    public void setJoinCode(String joinCode) { this.joinCode = joinCode; }
}
