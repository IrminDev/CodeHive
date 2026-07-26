package com.github.codehive.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.AssignmentFeedbackDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentFeedback;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.FeedbackStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.AssignmentFeedbackRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;

@Service
public class AssignmentFeedbackService {
    private final AssignmentFeedbackRepository feedbackRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final StudentAssignmentWorkService workService;
    private final UserRepository userRepository;
    private final NotificationDomainEventPublisher notificationPublisher;

    public AssignmentFeedbackService(AssignmentFeedbackRepository feedbackRepository,
                                     AssignmentRepository assignmentRepository,
                                     StudentAssignmentWorkRepository workRepository,
                                     StudentAssignmentWorkService workService,
                                     UserRepository userRepository,
                                     NotificationDomainEventPublisher notificationPublisher) {
        this.feedbackRepository = feedbackRepository;
        this.assignmentRepository = assignmentRepository;
        this.workRepository = workRepository;
        this.workService = workService;
        this.userRepository = userRepository;
        this.notificationPublisher = notificationPublisher;
    }

    @Transactional
    public AssignmentFeedbackDTO create(UUID assignmentId, UUID studentId, String body, String email) {
        User teacher = requireTeacher(email);
        Assignment assignment = requireOwnedAssignment(assignmentId, teacher);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + studentId));
        StudentAssignmentWork work = workService.getOrCreate(assignment, student);
        AssignmentFeedback feedback = new AssignmentFeedback();
        feedback.setStudentWork(work);
        feedback.setAuthor(teacher);
        feedback.setBody(body);
        feedback = feedbackRepository.save(feedback);
        notificationPublisher.publish(NotificationDomainEvent.of(
                NotificationType.FEEDBACK_RECEIVED, teacher.getId(), student.getId(),
                assignment.getGroup().getId(), assignment.getId(), null));
        return toDTO(feedback);
    }

    @Transactional
    public void delete(UUID feedbackId, String email) {
        User teacher = requireTeacher(email);
        AssignmentFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found: " + feedbackId));
        requireOwnedAssignment(feedback.getStudentWork().getAssignment().getId(), teacher);
        if (feedback.getStatus() == FeedbackStatus.DELETED) return;
        feedback.setStatus(FeedbackStatus.DELETED);
        feedback.setDeletedAt(Instant.now());
        feedback.setDeletedBy(teacher);
    }

    @Transactional(readOnly = true)
    public List<AssignmentFeedbackDTO> list(UUID assignmentId, UUID studentId, String email) {
        User caller = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (caller.getRole() == Role.TEACHER) {
            requireOwnedAssignment(assignmentId, caller);
        } else if (!caller.getId().equals(studentId)) {
            throw new AccessDeniedException("Students can only view their own feedback");
        }
        StudentAssignmentWork work = workRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student assignment work not found"));
        return feedbackRepository.findByStudentWorkIdOrderByCreatedAtAsc(work.getId())
                .stream().map(this::toDTO).toList();
    }

    private Assignment requireOwnedAssignment(UUID id, User teacher) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + id));
        if (!assignment.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can manage feedback");
        }
        return assignment;
    }

    private User requireTeacher(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (user.getRole() != Role.TEACHER) {
            throw new AccessDeniedException("Only teachers can manage feedback");
        }
        return user;
    }

    private AssignmentFeedbackDTO toDTO(AssignmentFeedback feedback) {
        StudentAssignmentWork work = feedback.getStudentWork();
        return new AssignmentFeedbackDTO(
                feedback.getId(), work.getAssignment().getId(), work.getStudent().getId(),
                feedback.getAuthor().getId(),
                feedback.getStatus() == FeedbackStatus.DELETED ? null : feedback.getBody(),
                feedback.getStatus(), feedback.getCreatedAt(), feedback.getDeletedAt());
    }
}
