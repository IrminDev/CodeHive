package com.github.codehive.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.github.codehive.messaging.producer.ExecutionRequestProducer;
import com.github.codehive.model.dto.queue.ExecutionJob;
import com.github.codehive.model.dto.queue.ExecutionTestCaseInfo;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.ReevaluationBatch;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.enums.ExecutionTrigger;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.ReevaluationBatchStatus;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.ReevaluationBatchRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.service.event.ReevaluationJobsCreatedEvent;
import com.github.codehive.service.event.ReevaluationRequestedEvent;
import com.github.codehive.utils.ObjectKeyBuilder;

@Service
public class ReevaluationService {
    private final AssignmentRepository assignmentRepository;
    private final TestSuiteRevisionRepository revisionRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final TestCaseRepository testCaseRepository;
    private final ExecutionRepository executionRepository;
    private final ReevaluationBatchRepository batchRepository;
    private final ExecutionRequestProducer executionProducer;
    private final ApplicationEventPublisher eventPublisher;

    public ReevaluationService(AssignmentRepository assignmentRepository,
                               TestSuiteRevisionRepository revisionRepository,
                               StudentAssignmentWorkRepository workRepository,
                               TestCaseRepository testCaseRepository,
                               ExecutionRepository executionRepository,
                               ReevaluationBatchRepository batchRepository,
                               ExecutionRequestProducer executionProducer,
                               ApplicationEventPublisher eventPublisher) {
        this.assignmentRepository = assignmentRepository;
        this.revisionRepository = revisionRepository;
        this.workRepository = workRepository;
        this.testCaseRepository = testCaseRepository;
        this.executionRepository = executionRepository;
        this.batchRepository = batchRepository;
        this.executionProducer = executionProducer;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void start(ReevaluationRequestedEvent event) {
        if (batchRepository.findByAssignmentIdAndTestSuiteRevisionId(
                event.assignmentId(), event.testSuiteRevisionId()).isPresent()) return;
        Assignment assignment = assignmentRepository.findById(event.assignmentId())
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found"));
        TestSuiteRevision revision = revisionRepository.findById(event.testSuiteRevisionId())
                .orElseThrow(() -> new EntityNotFoundException("Test suite revision not found"));

        ReevaluationBatch batch = new ReevaluationBatch();
        batch.setAssignment(assignment);
        batch.setTestSuiteRevision(revision);
        batch = batchRepository.save(batch);

        List<UUID> executionIds = new ArrayList<>();
        for (StudentAssignmentWork work : workRepository.findByAssignmentId(assignment.getId())) {
            Submission submission = work.getCurrentSubmission();
            if (submission == null || submission.getStatus() != SubmissionStatus.SUBMITTED
                    || executionRepository.existsBySubmissionIdAndTestSuiteRevisionId(
                            submission.getId(), revision.getId())) {
                continue;
            }
            executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(submission.getId())
                    .ifPresent(previous -> previous.setIsOutdated(true));
            Execution execution = new Execution(ExecutionType.DEFINITIVE, work.getStudent());
            execution.setSubmission(submission);
            execution.setTestSuiteRevision(revision);
            execution.setTrigger(ExecutionTrigger.ASSIGNMENT_UPDATE);
            execution.setReevaluationBatch(batch);
            execution = executionRepository.save(execution);
            executionIds.add(execution.getId());
        }
        batch.setTotal(executionIds.size());
        if (executionIds.isEmpty()) {
            batch.setStatus(ReevaluationBatchStatus.COMPLETED);
            batch.setCompletedAt(Instant.now());
        } else {
            batch.setStatus(ReevaluationBatchStatus.PROCESSING);
            eventPublisher.publishEvent(new ReevaluationJobsCreatedEvent(batch.getId(), executionIds));
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void dispatch(ReevaluationJobsCreatedEvent event) {
        ReevaluationBatch batch = batchRepository.findById(event.batchId())
                .orElseThrow(() -> new EntityNotFoundException("Re-evaluation batch not found"));
        int queued = batch.getQueued();
        for (UUID executionId : event.executionIds()) {
            Execution execution = executionRepository.findById(executionId).orElse(null);
            if (execution == null) continue;
            executionProducer.sendExecutionRequest(buildJob(execution));
            queued++;
        }
        batch.setQueued(queued);
    }

    private ExecutionJob buildJob(Execution execution) {
        Assignment assignment = execution.getSubmission().getAssignment();
        TestSuiteRevision revision = execution.getTestSuiteRevision();
        List<ExecutionTestCaseInfo> cases = testCaseRepository
                .findByTestSuiteRevisionIdOrderByOrderAsc(revision.getId()).stream()
                .map(testCase -> caseInfo(assignment, revision, execution, testCase))
                .toList();
        return new ExecutionJob(
                execution.getId(),
                execution.getSubmission().getSourceCodeKey(),
                null,
                execution.getSubmission().getLanguage(),
                ExecutionType.DEFINITIVE,
                cases,
                assignment.getTimeLimitMs(),
                assignment.getMemoryLimitMb(),
                assignment.getComparatorType(),
                ObjectKeyBuilder.executionReport(execution.getId()),
                null,
                revision.getId(),
                ExecutionTrigger.ASSIGNMENT_UPDATE.name());
    }

    private ExecutionTestCaseInfo caseInfo(Assignment assignment, TestSuiteRevision revision,
                                           Execution execution, TestCase testCase) {
        return new ExecutionTestCaseInfo(
                testCase.getId(), testCase.getOrder(),
                ObjectKeyBuilder.testCaseInput(assignment.getId(), revision.getId(), testCase.getId()),
                null,
                ObjectKeyBuilder.testCaseExpectedOutput(
                        assignment.getId(), revision.getId(), testCase.getId()),
                ObjectKeyBuilder.executionTestCaseStdout(execution.getId(), testCase.getId()),
                ObjectKeyBuilder.executionTestCaseStderr(execution.getId(), testCase.getId()));
    }
}
