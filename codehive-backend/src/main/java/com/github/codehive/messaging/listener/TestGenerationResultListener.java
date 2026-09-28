package com.github.codehive.messaging.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.queue.TestGenerationResult;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.service.AssignmentUpdateService;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;

import java.time.Instant;

@Component
public class TestGenerationResultListener {
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationResultListener.class);

    private final AssignmentRepository assignmentRepository;
    private final TestSuiteRevisionRepository testSuiteRevisionRepository;
    private final AssignmentUpdateService assignmentUpdateService;
    private final NotificationDomainEventPublisher notificationPublisher;

    public TestGenerationResultListener(AssignmentRepository assignmentRepository,
                                        TestSuiteRevisionRepository testSuiteRevisionRepository,
                                        AssignmentUpdateService assignmentUpdateService,
                                        NotificationDomainEventPublisher notificationPublisher) {
        this.assignmentRepository = assignmentRepository;
        this.testSuiteRevisionRepository = testSuiteRevisionRepository;
        this.assignmentUpdateService = assignmentUpdateService;
        this.notificationPublisher = notificationPublisher;
    }

    @RabbitListener(queues = "${rabbitmq.test-generation.result.queue:codehive_test_generation_result_queue}")
    @Transactional
    public void handleTestGenerationResult(TestGenerationResult result) {
        logger.info("[WORKFLOW] RABBITMQ RECEIVE: Test generation result - assignmentId={}, success={}, generated={}",
                result.getAssignmentId(), result.isSuccess(), result.getGeneratedCount());

        if (result.getAssignmentUpdateId() != null) {
            assignmentUpdateService.processValidationResult(result);
            return;
        }

        Assignment assignment = assignmentRepository.findById(result.getAssignmentId()).orElse(null);
        if (assignment == null) {
            logger.warn("[WORKFLOW] Assignment not found for test generation result - assignmentId={}",
                    result.getAssignmentId());
            return;
        }

        AssignmentValidationStatus previousStatus = assignment.getValidationStatus();
        com.github.codehive.model.entity.TestSuiteRevision revision =
                result.getTestSuiteRevisionId() != null
                        ? testSuiteRevisionRepository.findById(result.getTestSuiteRevisionId()).orElse(null)
                        : null;
        if (revision != null && !revision.getAssignment().getId().equals(assignment.getId())) {
            logger.warn("Ignoring mismatched test revision result: assignmentId={}, revisionId={}",
                    assignment.getId(), revision.getId());
            return;
        }
        if (result.isSuccess()) {
            if (revision != null) {
                if (assignment.getActiveTestSuiteRevision() != null
                        && !assignment.getActiveTestSuiteRevision().getId().equals(revision.getId())) {
                    assignment.getActiveTestSuiteRevision().setStatus(RevisionStatus.SUPERSEDED);
                }
                revision.setStatus(RevisionStatus.ACTIVE);
                revision.setActivatedAt(Instant.now());
                revision.getReferenceSolutionRevision().setStatus(RevisionStatus.ACTIVE);
                revision.getReferenceSolutionRevision().setActivatedAt(Instant.now());
                assignment.setActiveTestSuiteRevision(revision);
                assignment.setActiveReferenceSolutionRevision(revision.getReferenceSolutionRevision());
            }
            assignment.setValidationStatus(AssignmentValidationStatus.READY);
            assignmentRepository.save(assignment);
            if (previousStatus != AssignmentValidationStatus.READY) {
                notificationPublisher.publish(NotificationDomainEvent.of(
                        NotificationType.ASSIGNMENT_READY,
                        null, assignment.getAuthor().getId(), assignment.getGroup().getId(),
                        assignment.getId(), null));
            }
            if (assignment.getLaunchDate() == null || !Instant.now().isBefore(assignment.getLaunchDate())) {
                notificationPublisher.publish(NotificationDomainEvent.of(
                        NotificationType.ASSIGNMENT_PUBLISHED,
                        assignment.getAuthor().getId(), null, assignment.getGroup().getId(),
                        assignment.getId(), null));
            }
            logger.info("[WORKFLOW] Assignment validation completed - assignmentId={}, generatedOutputs={}",
                    assignment.getId(), result.getGeneratedCount());
        } else {
            String failureMessage = result.getErrorMessage();
            if (failureMessage == null || failureMessage.isBlank()) {
                failureMessage = "Test output generation failed without diagnostic output.";
            }
            if (revision != null) {
                revision.setStatus(RevisionStatus.FAILED);
                revision.setFailureMessage(failureMessage);
                revision.getReferenceSolutionRevision().setStatus(RevisionStatus.FAILED);
            }
            if (assignment.getActiveTestSuiteRevision() == null) {
                assignment.setValidationStatus(AssignmentValidationStatus.FAILED);
            }
            assignmentRepository.save(assignment);
            if (previousStatus != AssignmentValidationStatus.FAILED) {
                notificationPublisher.publish(NotificationDomainEvent.of(
                        NotificationType.ASSIGNMENT_VALIDATION_FAILED,
                        null, assignment.getAuthor().getId(), assignment.getGroup().getId(),
                        assignment.getId(), null));
            }
            logger.error("[WORKFLOW] Test generation failed for assignmentId={}, error={}",
                    result.getAssignmentId(), failureMessage);
        }
    }
}
