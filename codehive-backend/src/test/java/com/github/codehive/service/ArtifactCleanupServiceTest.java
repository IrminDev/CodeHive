package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;

class ArtifactCleanupServiceTest {
    private static final UUID EXECUTION_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    private ExecutionRepository executionRepository;
    private ObjectStorageService objectStorageService;
    private AssignmentUpdateRepository assignmentUpdateRepository;
    private TestSuiteRevisionRepository testSuiteRevisionRepository;
    private ReferenceSolutionRevisionRepository referenceSolutionRevisionRepository;
    private AssignmentRepository assignmentRepository;
    private ClassGroupRepository classGroupRepository;
    private ArtifactCleanupService service;

    @BeforeEach
    void setUp() {
        executionRepository = mock(ExecutionRepository.class);
        objectStorageService = mock(ObjectStorageService.class);
        assignmentUpdateRepository = mock(AssignmentUpdateRepository.class);
        testSuiteRevisionRepository = mock(TestSuiteRevisionRepository.class);
        referenceSolutionRevisionRepository = mock(ReferenceSolutionRevisionRepository.class);
        assignmentRepository = mock(AssignmentRepository.class);
        classGroupRepository = mock(ClassGroupRepository.class);
        service = new ArtifactCleanupService(executionRepository, objectStorageService,
                assignmentUpdateRepository, testSuiteRevisionRepository, referenceSolutionRevisionRepository,
                assignmentRepository, classGroupRepository);
        when(executionRepository.findByStatusAndCreatedAtBefore(any(), any())).thenReturn(List.of());
        when(executionRepository.findSoftDeletedArtifactCleanupCandidates(any())).thenReturn(List.of());
        when(assignmentUpdateRepository.findByStatusAndCompletedAtBefore(any(), any())).thenReturn(List.of());
        when(testSuiteRevisionRepository.findByStatusAndCreatedAtBefore(any(), any())).thenReturn(List.of());
        when(referenceSolutionRevisionRepository.findByStatusAndCreatedAtBefore(any(), any())).thenReturn(List.of());
        when(assignmentRepository.findByIsActiveFalseAndDeletedAtIsNull()).thenReturn(List.of());
        when(classGroupRepository.findByIsActiveFalseAndDeletedAtIsNull()).thenReturn(List.of());
    }

    @Test
    void removesExpiredPracticePrefixAndMarksExecutionPurged() throws Exception {
        Execution execution = execution(ExecutionType.PRACTICE);
        execution.setArtifactsExpireAt(Instant.now().minusSeconds(1));
        when(executionRepository.findByArtifactsExpireAtLessThanEqualAndArtifactsPurgedAtIsNull(any()))
                .thenReturn(List.of(execution));

        service.cleanup();

        verify(objectStorageService).deletePrefix("practice-executions/" + EXECUTION_ID + "/");
        assertThat(execution.getArtifactsPurgedAt()).isNotNull();
    }

    @Test
    void removesSoftDeletedDefinitiveArtifactsBeforeNormalExpiry() throws Exception {
        Execution execution = execution(ExecutionType.DEFINITIVE);
        execution.setArtifactsExpireAt(Instant.now().plusSeconds(60));
        when(executionRepository.findByArtifactsExpireAtLessThanEqualAndArtifactsPurgedAtIsNull(any()))
                .thenReturn(List.of());
        when(executionRepository.findSoftDeletedArtifactCleanupCandidates(any()))
                .thenReturn(List.of(execution));

        service.cleanup();

        verify(objectStorageService).deletePrefix("executions/" + EXECUTION_ID + "/");
        assertThat(execution.getArtifactsPurgedAt()).isNotNull();
    }

    @Test
    void leavesExecutionUnmarkedWhenObjectStorageDeleteFails() throws Exception {
        Execution execution = execution(ExecutionType.PRACTICE);
        execution.setArtifactsExpireAt(Instant.now().minusSeconds(1));
        when(executionRepository.findByArtifactsExpireAtLessThanEqualAndArtifactsPurgedAtIsNull(any()))
                .thenReturn(List.of(execution));
        doThrow(new RuntimeException("MinIO unavailable"))
                .when(objectStorageService).deletePrefix(any());

        service.cleanup();

        assertThat(execution.getArtifactsPurgedAt()).isNull();
        verify(objectStorageService).deletePrefix("practice-executions/" + EXECUTION_ID + "/");
    }

    @Test
    void finalizesStalePendingExecutionBeforePurge() throws Exception {
        Execution execution = execution(ExecutionType.PRACTICE);
        execution.setStatus(ExecutionStatus.PENDING);
        execution.setCreatedAt(LocalDateTime.now().minusHours(25));
        when(executionRepository.findByStatusAndCreatedAtBefore(eq(ExecutionStatus.PENDING), any()))
                .thenReturn(List.of(execution));
        when(executionRepository.findByArtifactsExpireAtLessThanEqualAndArtifactsPurgedAtIsNull(any()))
                .thenReturn(List.of(execution));

        service.cleanup();

        assertThat(execution.getStatus()).isEqualTo(ExecutionStatus.RTE);
        assertThat(execution.getArtifactsPurgedAt()).isNotNull();
        verify(objectStorageService).deletePrefix("practice-executions/" + EXECUTION_ID + "/");
    }

    @Test
    void givesLegacySoftDeletedRowsTheirFullGracePeriod() throws Exception {
        Assignment assignment = new Assignment();
        assignment.setIsActive(false);
        ClassGroup group = new ClassGroup();
        group.setIsActive(false);
        when(assignmentRepository.findByIsActiveFalseAndDeletedAtIsNull()).thenReturn(List.of(assignment));
        when(classGroupRepository.findByIsActiveFalseAndDeletedAtIsNull()).thenReturn(List.of(group));
        when(executionRepository.findByArtifactsExpireAtLessThanEqualAndArtifactsPurgedAtIsNull(any()))
                .thenReturn(List.of());

        service.cleanup();

        assertThat(assignment.getDeletedAt()).isNotNull();
        assertThat(group.getDeletedAt()).isNotNull();
        verify(objectStorageService, never()).deletePrefix(any());
    }

    private Execution execution(ExecutionType type) {
        Execution execution = new Execution(type);
        execution.setId(EXECUTION_ID);
        execution.setStatus(ExecutionStatus.AC);
        return execution;
    }
}
