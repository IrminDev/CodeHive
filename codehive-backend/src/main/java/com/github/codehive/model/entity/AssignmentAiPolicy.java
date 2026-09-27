package com.github.codehive.model.entity;

import java.util.UUID;

import com.github.codehive.model.enums.AiAssistanceLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "assignment_ai_policies")
public class AssignmentAiPolicy {
    @Id
    private UUID assignmentId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false)
    private int maxAiRequests;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AiAssistanceLevel level = AiAssistanceLevel.CONCEPTUAL_ONLY;

    @Version
    @Column(nullable = false)
    private long version;

    public UUID getAssignmentId() { return assignmentId; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public int getMaxAiRequests() { return maxAiRequests; }
    public void setMaxAiRequests(int maxAiRequests) { this.maxAiRequests = maxAiRequests; }
    public AiAssistanceLevel getLevel() { return level; }
    public void setLevel(AiAssistanceLevel level) { this.level = level; }
    public long getVersion() { return version; }
}
