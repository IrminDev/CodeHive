package com.github.codehive.model.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "assignment_examples", uniqueConstraints = @UniqueConstraint(
        name = "uk_assignment_example_order", columnNames = {"assignment_id", "order_index"}))
public class AssignmentExample {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(name = "order_index", nullable = false)
    private Integer order;

    @Column(name = "example_input", nullable = false, columnDefinition = "TEXT")
    private String input;

    @Column(name = "example_output", nullable = false, columnDefinition = "TEXT")
    private String output;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    public AssignmentExample() {}

    public AssignmentExample(Assignment assignment, Integer order, String input, String output, String explanation) {
        this.assignment = assignment;
        this.order = order;
        this.input = input;
        this.output = output;
        this.explanation = explanation;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}
