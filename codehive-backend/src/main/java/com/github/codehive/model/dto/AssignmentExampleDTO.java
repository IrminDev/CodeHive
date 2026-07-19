package com.github.codehive.model.dto;

import java.util.UUID;

public class AssignmentExampleDTO {
    private UUID id;
    private Integer order;
    private String input;
    private String output;
    private String explanation;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}
