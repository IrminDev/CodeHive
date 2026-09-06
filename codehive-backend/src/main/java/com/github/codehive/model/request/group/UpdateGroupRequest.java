package com.github.codehive.model.request.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateGroupRequest {
    @NotBlank(message = "Group name is required")
    @Size(max = 120, message = "Group name must not exceed 120 characters")
    private String name;
    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
