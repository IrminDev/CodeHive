package com.github.codehive.model.dto;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.github.codehive.model.enums.Language;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReferenceSolutionDTO {
    private UUID id;
    private UUID assignmentId;
    private Language language;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(UUID assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }
}
