package com.github.codehive.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.AssignmentGradeDTO;
import com.github.codehive.model.dto.BulkGradeReturnDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.AssignmentGradeHistory;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.GradeChangeReason;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.AssignmentGradeHistoryRepository;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;

@Service
public class AssignmentGradeService {
    private final AssignmentGradeRepository gradeRepository;
    private final AssignmentGradeHistoryRepository historyRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final UserRepository userRepository;
    private final NotificationDomainEventPublisher notificationPublisher;
    private final StudentAssignmentWorkService workService;

    public AssignmentGradeService(AssignmentGradeRepository gradeRepository,
                                  AssignmentGradeHistoryRepository historyRepository,
                                  AssignmentRepository assignmentRepository,
                                  StudentAssignmentWorkRepository workRepository,
                                  UserRepository userRepository,
                                  NotificationDomainEventPublisher notificationPublisher,
                                  StudentAssignmentWorkService workService) {
        this.gradeRepository = gradeRepository;
        this.historyRepository = historyRepository;
        this.assignmentRepository = assignmentRepository;
        this.workRepository = workRepository;
        this.userRepository = userRepository;
        this.notificationPublisher = notificationPublisher;
        this.workService = workService;
    }

    @Transactional
    public AssignmentGradeDTO saveDraft(UUID assignmentId, UUID studentId, BigDecimal value,
                                        String email) {
        User teacher = requireUser(email);
        Assignment assignment = requireOwnedAssignment(assignmentId, teacher);
        if (value.signum() < 0) {
            throw new ValidationException("Grade cannot be negative");
        }
        if (value.compareTo(assignment.getMaxPoints()) > 0) {
            throw new ValidationException("Grade cannot exceed assignment maxPoints");
        }
        StudentAssignmentWork work = workRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseGet(() -> createMissingWorkForZeroGrade(assignment, studentId, value));
        requireVisibleStudent(work);
        AssignmentGrade grade = gradeRepository.findByStudentWorkId(work.getId())
                .orElseGet(AssignmentGrade::new);
        boolean created = grade.getId() == null;
        grade.setStudentWork(work);
        grade.setValue(value);
        grade.setMaxPointsSnapshot(assignment.getMaxPoints());
        grade.setStatus(GradeStatus.DRAFT);
        grade.setGradedBy(teacher);
        grade.setGradedSubmission(work.getCurrentSubmission());
        grade.setUpdatedAt(Instant.now());
        grade.setReturnedAt(null);
        grade = gradeRepository.save(grade);
        record(grade, created ? GradeChangeReason.CREATED : GradeChangeReason.UPDATED, teacher);
        return toDTO(grade);
    }

    @Transactional
    public AssignmentGradeDTO returnGrade(UUID assignmentId, UUID studentId, String email) {
        User teacher = requireUser(email);
        requireOwnedAssignment(assignmentId, teacher);
        StudentAssignmentWork work = requireWork(assignmentId, studentId);
        requireVisibleStudent(work);
        AssignmentGrade grade = gradeRepository.findByStudentWorkId(work.getId())
                .orElseThrow(() -> new EntityNotFoundException("No draft grade exists"));
        grade.setStatus(GradeStatus.RETURNED);
        grade.setReturnedAt(Instant.now());
        grade.setUpdatedAt(Instant.now());
        record(grade, GradeChangeReason.RETURNED, teacher);
        notificationPublisher.publish(NotificationDomainEvent.of(
                NotificationType.GRADE_RETURNED, teacher.getId(), work.getStudent().getId(),
                work.getAssignment().getGroup().getId(), work.getAssignment().getId(), null,
                grade.getId()));
        return toDTO(grade);
    }

    @Transactional
    public BulkGradeReturnDTO returnAllDrafts(UUID assignmentId, String email) {
        User teacher = requireUser(email);
        requireOwnedAssignment(assignmentId, teacher);
        List<AssignmentGrade> drafts = gradeRepository
                .findByStudentWorkAssignmentIdAndStatus(assignmentId, GradeStatus.DRAFT).stream()
                .filter(grade -> grade.getStudentWork().getStudent().canParticipate()).toList();
        Instant returnedAt = Instant.now();
        drafts.forEach(grade -> {
            grade.setStatus(GradeStatus.RETURNED);
            grade.setReturnedAt(returnedAt);
            grade.setUpdatedAt(returnedAt);
            record(grade, GradeChangeReason.RETURNED, teacher);
            StudentAssignmentWork work = grade.getStudentWork();
            notificationPublisher.publish(NotificationDomainEvent.of(
                    NotificationType.GRADE_RETURNED, teacher.getId(), work.getStudent().getId(),
                    work.getAssignment().getGroup().getId(), assignmentId, null, grade.getId()));
        });
        return new BulkGradeReturnDTO(assignmentId, drafts.size());
    }

    @Transactional(readOnly = true)
    public AssignmentGradeDTO getForStudent(UUID assignmentId, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        StudentAssignmentWork work = requireWork(assignmentId, student.getId());
        AssignmentGrade grade = gradeRepository.findByStudentWorkId(work.getId())
                .filter(item -> item.getStatus() == GradeStatus.RETURNED)
                .orElseThrow(() -> new EntityNotFoundException("No returned grade exists"));
        return toDTO(grade);
    }

    @Transactional
    public boolean clearGrade(StudentAssignmentWork work, GradeChangeReason reason, User actor) {
        AssignmentGrade grade = gradeRepository.findByStudentWorkId(work.getId()).orElse(null);
        if (grade == null) return false;
        record(grade, reason, actor);
        gradeRepository.delete(grade);
        return true;
    }

    @Transactional
    public int clearAssignmentGrades(Assignment assignment, GradeChangeReason reason, User actor) {
        List<AssignmentGrade> grades = gradeRepository.findByStudentWorkAssignmentId(assignment.getId());
        grades.forEach(grade -> {
            record(grade, reason, actor);
            gradeRepository.delete(grade);
        });
        return grades.size();
    }

    private void record(AssignmentGrade grade, GradeChangeReason reason, User actor) {
        AssignmentGradeHistory history = new AssignmentGradeHistory();
        history.setStudentWork(grade.getStudentWork());
        history.setValue(grade.getValue());
        history.setMaxPoints(grade.getMaxPointsSnapshot());
        history.setStatus(grade.getStatus());
        history.setReason(reason);
        history.setActor(actor);
        historyRepository.save(history);
    }

    private Assignment requireOwnedAssignment(UUID id, User teacher) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + id));
        if (!teacher.canManageGroups() || !assignment.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can grade it");
        }
        return assignment;
    }

    private StudentAssignmentWork requireWork(UUID assignmentId, UUID studentId) {
        return workRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student assignment work not found"));
    }

    private StudentAssignmentWork createMissingWorkForZeroGrade(Assignment assignment, UUID studentId,
                                                                 BigDecimal value) {
        if (value.signum() != 0) {
            throw new ValidationException("Students without a submission can only receive a zero grade");
        }
        User student = userRepository.findById(studentId)
                .filter(User::canParticipate)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + studentId));
        return workService.getOrCreate(assignment, student);
    }

    private void requireVisibleStudent(StudentAssignmentWork work) {
        if (!work.getStudent().canParticipate()) {
            throw new EntityNotFoundException("Student assignment work not found");
        }
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private AssignmentGradeDTO toDTO(AssignmentGrade grade) {
        StudentAssignmentWork work = grade.getStudentWork();
        return new AssignmentGradeDTO(
                grade.getId(), work.getAssignment().getId(), work.getStudent().getId(),
                grade.getGradedSubmission() != null ? grade.getGradedSubmission().getId() : null,
                grade.getValue(), grade.getMaxPointsSnapshot(), grade.getStatus(),
                grade.getUpdatedAt(), grade.getReturnedAt());
    }
}
