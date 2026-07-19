package com.github.codehive.model.request.assignment;

import jakarta.validation.constraints.NotNull;

public class AssignmentExampleRequest {
    @NotNull(message = "Example input is required")
    private String input;

    @NotNull(message = "Example output is required")
    private String output;

    @NotNull(message = "Example explanation is required")
    private String explanation;

    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}
