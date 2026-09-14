package com.github.codehive.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.AssignmentUpdate;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.enums.AssignmentUpdateStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;

/** Removes only disposable execution artifacts. Academic source and active test assets stay intact. */
@Service
public class ArtifactCleanupService {
    private static final Logger logger = LoggerFactory.getLogger(ArtifactCleanupService.class);

    private final ExecutionRepository executionRepository;
    private final ObjectStorageService objectStorageService;
    private final AssignmentUpdateRepository assignmentUpdateRepository;
    private final TestSuiteRevisionRepository testSuiteRevisionRepository;
    private final ReferenceSolutionRevisionRepository referenceSolutionRevisionRepository;
    private final AssignmentRepository assignmentRepository;
    private final ClassGroupRepository classGroupRepository;

    @Value("${artifact-cleanup.soft-delete-grace-days:14}")
    private long softDeleteGraceDays = 14;

    @Value("${artifact-cleanup.stale-pending-hours:24}")
    private long stalePendingHours = 24;

    @Value("${artifact-cleanup.rejected-revision-hours:6}")
    private long rejectedRevisionHours = 6;

    @Value("${artifact-cleanup.superseded-revision-days:90}")
    private long supersededRevisionDays = 90;

    public ArtifactCleanupService(ExecutionRepository executionRepository,
                                  ObjectStorageService objectStorageService,
                                  AssignmentUpdateRepository assignmentUpdateRepository,
                                  TestSuiteRevisionRepository testSuiteRevisionRepository,
                                  ReferenceSolutionRevisionRepository referenceSolutionRevisionRepository,
                                  AssignmentRepository assignmentRepository,
                                  ClassGroupRepository classGroupRepository) {
        this.executionRepository = executionRepository;
        this.objectStorageService = objectStorageService;
        this.assignmentUpdateRepository = assignmentUpdateRepository;
        this.testSuiteRevisionRepository = testSuiteRevisionRepository;
        this.referenceSolutionRevisionRepository = referenceSolutionRevisionRepository;
        this.assignmentRepository = assignmentRepository;
        this.classGroupRepository = classGroupRepository;
    }

    @Scheduled(initialDelayString = "${artifact-cleanup.initial-delay-ms:60000}",
            fixedDelayString = "${artifact-cleanup.fixed-delay-ms:3600000}")
    @Transactional
    public void cleanup() {
        Instant now = Instant.now();
        markLegacySoftDeletes(now);
        expireStalePendingExecutions(now);

        Map<UUID, Execution> candidates = new LinkedHashMap<>();
        executionRepository.findByArtifactsExpireAtLessThanEqualAndArtifactsPurgedAtIsNull(now)
                .stream()
                .filter(execution -> execution.getStatus() != ExecutionStatus.PENDING)
                .forEach(execution -> candidates.put(execution.getId(), execution));
        executionRepository.findSoftDeletedArtifactCleanupCandidates(
                        now.minus(softDeleteGraceDays, ChronoUnit.DAYS))
                .forEach(execution -> candidates.put(execution.getId(), execution));

        int deleted = 0;
        for (Execution execution : candidates.values()) {
            if (purge(execution, now)) deleted++;
        }
        cleanupRejectedValidationArtifacts(now);
        cleanupSupersededRevisionArtifacts(now);
        if (deleted > 0) logger.info("Artifact cleanup purged {} execution artifact sets", deleted);
    }

    private void expireStalePendingExecutions(Instant now) {
        LocalDateTime staleBefore = LocalDateTime.now().minus(stalePendingHours, ChronoUnit.HOURS);
        for (Execution execution : executionRepository
                .findByStatusAndCreatedAtBefore(ExecutionStatus.PENDING, staleBefore)) {
            execution.setStatus(ExecutionStatus.RTE);
            execution.setArtifactsExpireAt(now);
            logger.warn("Marked stale execution as expired: executionId={}", execution.getId());
        }
    }

    private void markLegacySoftDeletes(Instant now) {
        for (Assignment assignment : assignmentRepository.findByIsActiveFalseAndDeletedAtIsNull()) {
            assignment.setDeletedAt(now);
        }
        for (ClassGroup group : classGroupRepository.findByIsActiveFalseAndDeletedAtIsNull()) {
            group.setDeletedAt(now);
        }
    }

    private boolean purge(Execution execution, Instant now) {
        try {
            objectStorageService.deletePrefix(artifactPrefix(execution));
            execution.setArtifactsPurgedAt(now);
            return true;
        } catch (Exception exception) {
            logger.warn("Could not purge execution artifacts; retrying next run: executionId={}",
                    execution.getId(), exception);
            return false;
        }
    }

    private void cleanupRejectedValidationArtifacts(Instant now) {
        Instant cutoff = now.minus(rejectedRevisionHours, ChronoUnit.HOURS);
        cleanupUpdateValidationArtifacts(AssignmentUpdateStatus.REJECTED, cutoff, now);
        cleanupUpdateValidationArtifacts(AssignmentUpdateStatus.APPLIED, cutoff, now);

        for (TestSuiteRevision revision : testSuiteRevisionRepository
                .findByStatusAndCreatedAtBefore(RevisionStatus.FAILED, cutoff)) {
            if (revision.getArtifactsPurgedAt() != null) continue;
            try {
                objectStorageService.deletePrefix("assignments/" + revision.getAssignment().getId()
                        + "/test-suite-revisions/" + revision.getId() + "/");
                revision.setArtifactsPurgedAt(now);
            } catch (Exception exception) {
                logger.warn("Could not purge failed test-suite artifacts; retrying next run: revisionId={}",
                        revision.getId(), exception);
            }
        }

        for (ReferenceSolutionRevision revision : referenceSolutionRevisionRepository
                .findByStatusAndCreatedAtBefore(RevisionStatus.FAILED, cutoff)) {
            if (revision.getArtifactsPurgedAt() != null || "pending".equals(revision.getObjectKey())) continue;
            try {
                objectStorageService.deleteObject(revision.getObjectKey());
                revision.setArtifactsPurgedAt(now);
            } catch (Exception exception) {
                logger.warn("Could not purge failed reference artifact; retrying next run: revisionId={}",
                        revision.getId(), exception);
            }
        }
    }

    private void cleanupUpdateValidationArtifacts(AssignmentUpdateStatus status,
                                                  Instant cutoff, Instant now) {
        for (AssignmentUpdate update : assignmentUpdateRepository
                .findByStatusAndCompletedAtBefore(status, cutoff)) {
            if (update.getArtifactsPurgedAt() != null) continue;
            try {
                objectStorageService.deletePrefix("assignment-update-validations/"
                        + update.getAssignment().getId() + "/" + update.getId() + "/");
                update.setArtifactsPurgedAt(now);
            } catch (Exception exception) {
                logger.warn("Could not purge update-validation artifacts; retrying next run: updateId={}",
                        update.getId(), exception);
            }
        }
    }

    private void cleanupSupersededRevisionArtifacts(Instant now) {
        Instant cutoff = now.minus(supersededRevisionDays, ChronoUnit.DAYS);
        for (TestSuiteRevision revision : testSuiteRevisionRepository
                .findByStatusAndCreatedAtBefore(RevisionStatus.SUPERSEDED, cutoff)) {
            if (revision.getArtifactsPurgedAt() != null || executionRepository
                    .existsByTestSuiteRevisionIdAndStatus(revision.getId(), ExecutionStatus.PENDING)) {
                continue;
            }
            try {
                objectStorageService.deletePrefix("assignments/" + revision.getAssignment().getId()
                        + "/test-suite-revisions/" + revision.getId() + "/");
                revision.setArtifactsPurgedAt(now);
            } catch (Exception exception) {
                logger.warn("Could not purge superseded test-suite artifacts; retrying next run: revisionId={}",
                        revision.getId(), exception);
            }
        }

        for (ReferenceSolutionRevision revision : referenceSolutionRevisionRepository
                .findByStatusAndCreatedAtBefore(RevisionStatus.SUPERSEDED, cutoff)) {
            boolean currentReference = revision.getAssignment().getActiveReferenceSolutionRevision() != null
                    && revision.getAssignment().getActiveReferenceSolutionRevision().getId()
                            .equals(revision.getId());
            if (revision.getArtifactsPurgedAt() != null || currentReference
                    || testSuiteRevisionRepository.existsByReferenceSolutionRevisionIdAndStatus(
                            revision.getId(), RevisionStatus.ACTIVE)
                    || executionRepository.existsByTestSuiteRevisionReferenceSolutionRevisionIdAndStatus(
                            revision.getId(), ExecutionStatus.PENDING)) {
                continue;
            }
            try {
                objectStorageService.deleteObject(revision.getObjectKey());
                revision.setArtifactsPurgedAt(now);
            } catch (Exception exception) {
                logger.warn("Could not purge superseded reference artifact; retrying next run: revisionId={}",
                        revision.getId(), exception);
            }
        }
    }

    private String artifactPrefix(Execution execution) {
        return execution.getExecutionType() == ExecutionType.PRACTICE
                ? "practice-executions/" + execution.getId() + "/"
                : "executions/" + execution.getId() + "/";
    }
}
