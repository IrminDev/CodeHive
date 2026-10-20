package com.github.codehive.model.request.assignment;

import jakarta.validation.constraints.NotNull;

public class CloneTestCaseRequest {
    @NotNull(message = "Test case input is required")
    private String input;
    private Boolean sample = false;

    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public Boolean getSample() { return sample; }
    public void setSample(Boolean sample) { this.sample = sample; }
}
