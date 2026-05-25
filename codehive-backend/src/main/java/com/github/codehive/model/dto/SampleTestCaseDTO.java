package com.github.codehive.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SampleTestCaseDTO {
    private int order;
    private String input;

    public SampleTestCaseDTO() {}

    public SampleTestCaseDTO(int order, String input) {
        this.order = order;
        this.input = input;
    }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
}
