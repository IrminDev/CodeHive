package com.github.codehive.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.github.codehive.model.enums.Language;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReferenceSolutionDTO {
    private Long id;
    private Long assignmentId;
    private Language language;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }
}
