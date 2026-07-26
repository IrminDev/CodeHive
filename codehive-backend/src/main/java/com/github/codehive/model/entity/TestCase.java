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

@Entity
@Table(name = "test_cases")
public class TestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_suite_revision_id")
    private TestSuiteRevision testSuiteRevision;
    
    @Column(nullable = false, name = "order_index")
    private Integer order;
    
    @Column(nullable = false)
    private Boolean isSample;

    public TestCase() {
        this.isSample = false;
    }

    public TestCase(Assignment assignment, Integer order, Boolean isSample) {
        this();
        this.assignment = assignment;
        this.order = order;
        this.isSample = isSample;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Assignment getAssignment() {
        return assignment;
    }

    public void setAssignment(Assignment assignment) {
        this.assignment = assignment;
    }

    public TestSuiteRevision getTestSuiteRevision() { return testSuiteRevision; }
    public void setTestSuiteRevision(TestSuiteRevision revision) { this.testSuiteRevision = revision; }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public Boolean getIsSample() {
        return isSample;
    }

    public void setIsSample(Boolean isSample) {
        this.isSample = isSample;
    }
}
