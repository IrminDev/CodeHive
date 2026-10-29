package com.github.codehive.service.assistant;

import java.io.InputStream;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.dto.queue.TestCaseResult;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentExample;
import com.github.codehive.model.entity.AssistantInteraction;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssistantInteractionRepository;
import com.github.codehive.repository.AssistantConversationRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.service.ObjectStorageService;
import com.github.codehive.utils.ObjectKeyBuilder;

@Service
public class AssistantContextService {
    private static final int REPORT_BYTES = 65_536;
    private static final int HISTORY_CHARS = 8_000;

    private final AssignmentRepository assignments;
    private final ExecutionRepository executions;
    private final AssistantInteractionRepository interactions;
    private final AssistantConversationRepository conversations;
    private final ObjectStorageService storage;
    private final ObjectMapper mapper;
    private final Clock clock;

    public AssistantContextService(AssignmentRepository assignments, ExecutionRepository executions,
            AssistantInteractionRepository interactions, AssistantConversationRepository conversations,
            ObjectStorageService storage, ObjectMapper mapper,
            @Qualifier("assistantClock") Clock clock) {
        this.assignments = assignments;
        this.executions = executions;
        this.interactions = interactions;
        this.conversations = conversations;
        this.storage = storage;
        this.mapper = mapper;
        this.clock = clock;
    }

    public record PublicExample(String input, String output, String explanation) {}
    public record PublicAssignment(UUID id, String title, String description, List<String> constraints,
            List<String> hints, List<String> tags, List<Language> allowedLanguages,
            List<PublicExample> examples) {}
    public record PracticeDiagnostic(int testNumber, ExecutionStatus status, String feedback, String stderr) {}
    public record ExecutionContext(UUID id, ExecutionType type, ExecutionStatus status,
            LocalDateTime createdAt, Long timeMs, Long memoryMb, String reportState,
            String compilationDiagnostic, List<PracticeDiagnostic> practiceDiagnostics) {}
    public record HistoryTurn(String studentMessage, String approvedResponseJson) {}
    public record Context(PublicAssignment assignment, String editorCode, ExecutionContext execution,
            boolean executionUnavailable, List<HistoryTurn> history, boolean historyTruncated) {}

    @Transactional(readOnly = true)
    public Context build(UUID assignmentId, UUID studentId, UUID conversationId,
            boolean includeEditorCode, String editorCode, boolean includeExecutionContext,
            AiAssistanceLevel currentLevel) {
        if (assignmentId == null || studentId == null || currentLevel == null
                || (includeEditorCode && (editorCode == null || editorCode.isBlank()
                        || editorCode.length() > 32_768))
                || (!includeEditorCode && editorCode != null && !editorCode.isEmpty())) {
            throw new ValidationException("Invalid assistant context selection");
        }
        Assignment assignment = assignments.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found"));
        PublicAssignment publicAssignment = publicAssignment(assignment);
        ExecutionContext execution = null;
        boolean unavailable = false;
        if (includeExecutionContext) {
            List<Execution> latest = executions.findLatestStudentInitiated(
                    assignmentId, studentId, PageRequest.of(0, 1));
            if (latest.isEmpty()) unavailable = true;
            else execution = executionContext(latest.getFirst());
        }
        List<HistoryTurn> history = new ArrayList<>();
        boolean truncated = false;
        if (conversationId != null) {
            var conversation = conversations.findById(conversationId)
                    .orElseThrow(() -> new EntityNotFoundException("Assistant conversation not found"));
            if (!conversation.getAssignment().getId().equals(assignmentId)
                    || !conversation.getStudent().getId().equals(studentId)) {
                throw new EntityNotFoundException("Assistant conversation not found");
            }
            List<AssistantInteraction> recent = interactions.findByConversationIdAndStatusInOrderBySequenceDesc(
                    conversationId, List.of(AssistantInteractionStatus.COMPLETED,
                            AssistantInteractionStatus.REDIRECTED), PageRequest.of(0, 30));
            int remaining = HISTORY_CHARS;
            for (AssistantInteraction item : recent) {
                if (item.isContentErased() || item.getStudentMessage() == null
                        || item.getAssistantResponse() == null
                        || item.getCompletedAssistanceLevel() == null
                        || item.getCompletedAssistanceLevel().ordinal() > currentLevel.ordinal()) continue;
                int chars = item.getStudentMessage().length() + item.getAssistantResponse().length();
                if (chars > remaining) { truncated = true; break; }
                history.add(new HistoryTurn(item.getStudentMessage(), item.getAssistantResponse()));
                remaining -= chars;
            }
            if (recent.size() == 30) truncated = true;
            Collections.reverse(history);
        }
        return new Context(publicAssignment, includeEditorCode ? editorCode : null, execution,
                unavailable, List.copyOf(history), truncated);
    }

    private PublicAssignment publicAssignment(Assignment assignment) {
        List<PublicExample> examples = assignment.getExamples().stream()
                .sorted(java.util.Comparator.comparing(AssignmentExample::getOrder))
                .limit(5)
                .map(example -> new PublicExample(bound(example.getInput(), 500),
                        bound(example.getOutput(), 500), bound(example.getExplanation(), 500))).toList();
        return new PublicAssignment(assignment.getId(), bound(assignment.getTitle(), 200),
                bound(assignment.getDescription(), 5_000), boundList(assignment.getConstraints(), 10, 500),
                boundList(assignment.getHints(), 10, 500), boundList(assignment.getTags(), 10, 80),
                List.copyOf(assignment.getAllowedLanguages()), examples);
    }

    private ExecutionContext executionContext(Execution execution) {
        if (execution.getArtifactsPurgedAt() != null
                || !execution.getArtifactsExpireAt().isAfter(clock.instant())) {
            return summary(execution, "EXPIRED", null, List.of());
        }
        String key = execution.getExecutionType() == ExecutionType.PRACTICE
                ? ObjectKeyBuilder.practiceExecutionReport(execution.getId())
                : ObjectKeyBuilder.executionReport(execution.getId());
        try (InputStream stream = storage.download(key)) {
            byte[] bytes = stream.readNBytes(REPORT_BYTES + 1);
            if (bytes.length > REPORT_BYTES) return summary(execution, "UNAVAILABLE", null, List.of());
            ExecutionReport report = mapper.readValue(bytes, ExecutionReport.class);
            if (report.getExecutionId() != null && !report.getExecutionId().equals(execution.getId())) {
                return summary(execution, "UNAVAILABLE", null, List.of());
            }
            String compilation = execution.getStatus() == ExecutionStatus.CE
                    ? bound(report.getCompilationError(), 1_000) : null;
            List<PracticeDiagnostic> practice = execution.getExecutionType() == ExecutionType.PRACTICE
                    ? report.getTestCaseResults().stream().limit(5)
                            .map(result -> practiceDiagnostic(result)).toList() : List.of();
            return summary(execution, "AVAILABLE", compilation, practice);
        } catch (Exception exception) {
            return summary(execution, "UNAVAILABLE", null, List.of());
        }
    }

    private PracticeDiagnostic practiceDiagnostic(TestCaseResult result) {
        return new PracticeDiagnostic(result.getTestCaseNumber(), result.getStatus(),
                bound(result.getFeedback(), 300), bound(result.getStderr(), 500));
    }

    private ExecutionContext summary(Execution execution, String state, String compilation,
            List<PracticeDiagnostic> practice) {
        return new ExecutionContext(execution.getId(), execution.getExecutionType(), execution.getStatus(),
                execution.getCreatedAt(), execution.getTimeMs(), execution.getMemoryMb(),
                state, compilation, practice);
    }

    private List<String> boundList(List<String> values, int count, int perItem) {
        if (values == null) return List.of();
        return values.stream().limit(count).map(value -> bound(value, perItem)).toList();
    }

    private String bound(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
