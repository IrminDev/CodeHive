package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.repository.ExecutionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExecutionResultServiceTest {
    private static final UUID EXECUTION_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private ExecutionRepository executionRepository;

    @Mock
    private NotificationDomainEventPublisher notificationPublisher;

    @InjectMocks
    private ExecutionResultService service;

    @Test
    void persistsWorkerPeakMemoryInMebibytes() {
        Execution execution = execution();
        when(executionRepository.findById(EXECUTION_ID)).thenReturn(Optional.of(execution));
        ExecutionReport report = report();
        report.setMaxMemoryUsedMb(73L);
        report.setMaxExecutionTimeMs(245L);

        service.processExecutionResult(report);

        assertThat(execution.getMemoryMb()).isEqualTo(73L);
        assertThat(execution.getTimeMs()).isEqualTo(245L);
        assertThat(execution.getStatus()).isEqualTo(ExecutionStatus.AC);
        verify(executionRepository).save(execution);
    }

    @Test
    void missingTelemetryDoesNotErasePersistedMemory() {
        Execution execution = execution();
        execution.setMemoryMb(41L);
        when(executionRepository.findById(EXECUTION_ID)).thenReturn(Optional.of(execution));

        service.processExecutionResult(report());

        assertThat(execution.getMemoryMb()).isEqualTo(41L);
    }

    private Execution execution() {
        Execution execution = new Execution(ExecutionType.PRACTICE);
        execution.setId(EXECUTION_ID);
        return execution;
    }

    private ExecutionReport report() {
        ExecutionReport report = new ExecutionReport(EXECUTION_ID);
        report.setOverallStatus(ExecutionStatus.AC);
        return report;
    }
}
