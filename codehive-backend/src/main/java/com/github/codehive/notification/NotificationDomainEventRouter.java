package com.github.codehive.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Component
public class NotificationDomainEventRouter {
    private final NotificationDispatchService dispatchService;
    private final ClassGroupRepository groupRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public NotificationDomainEventRouter(NotificationDispatchService dispatchService,
                                         ClassGroupRepository groupRepository,
                                         AssignmentRepository assignmentRepository,
                                         SubmissionRepository submissionRepository,
                                         GroupEnrollmentRepository enrollmentRepository,
                                         UserRepository userRepository) {
        this.dispatchService = dispatchService;
        this.groupRepository = groupRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void route(NotificationDomainEvent event) {
        switch (event.type()) {
            case STUDENT_ENROLLED, STUDENT_LEFT -> routeGroupOwner(event);
            case ASSIGNMENT_READY, ASSIGNMENT_VALIDATION_FAILED, ASSIGNMENT_GRADES_CLEARED ->
                    routeAssignmentOwner(event);
            case ASSIGNMENT_SUBMITTED, LATE_ASSIGNMENT_SUBMITTED -> routeSubmissionToOwner(event);
            case REMOVED_FROM_GROUP -> routeSubjectUser(event);
            case GROUP_ARCHIVED -> routeGroupStudents(event, false);
            case ASSIGNMENT_PUBLISHED, ASSIGNMENT_RESCHEDULED, ASSIGNMENT_UPDATED,
                 ASSIGNMENT_TESTS_UPDATED -> routeAssignmentStudents(event);
            case SUBMISSION_EVALUATED, SUBMISSION_REEVALUATED -> routeSubmissionStudent(event);
            case FEEDBACK_RECEIVED, GRADE_RETURNED -> routeSubjectUser(event);
            case ASSIGNMENT_DUE_SOON, ASSIGNMENT_CLOSE_SOON,
                 ASSIGNMENT_DUE_SOON_NO_SUBMISSION, ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION -> {
                // Reminder messages are created directly by NotificationReminderScheduler.
            }
        }
    }

    private void routeGroupOwner(NotificationDomainEvent event) {
        groupRepository.findById(event.groupId()).ifPresent(group -> send(event, group.getOwner(), false));
    }

    private void routeAssignmentOwner(NotificationDomainEvent event) {
        assignmentRepository.findById(event.assignmentId())
                .ifPresent(assignment -> send(event, assignment.getGroup().getOwner(), false));
    }

    private void routeSubmissionToOwner(NotificationDomainEvent event) {
        submissionRepository.findById(event.submissionId())
                .ifPresent(submission -> send(event, submission.getAssignment().getGroup().getOwner(), false));
    }

    private void routeSubjectUser(NotificationDomainEvent event) {
        if (event.subjectUserId() == null) return;
        userRepository.findById(event.subjectUserId()).ifPresent(user -> send(event, user, false));
    }

    private void routeGroupStudents(NotificationDomainEvent event, boolean deduplicate) {
        ClassGroup group = groupRepository.findById(event.groupId()).orElse(null);
        if (group == null) return;
        List<GroupEnrollment> enrollments = enrollmentRepository
                .findByGroupIdAndStatusOrderByJoinedAtAsc(group.getId(), EnrollmentStatus.ACTIVE);
        for (GroupEnrollment enrollment : enrollments) {
            send(event, enrollment.getStudent(), deduplicate);
        }
    }

    private void routeAssignmentStudents(NotificationDomainEvent event) {
        Assignment assignment = assignmentRepository.findById(event.assignmentId()).orElse(null);
        if (assignment == null) return;
        List<GroupEnrollment> enrollments = enrollmentRepository
                .findByGroupIdAndStatusOrderByJoinedAtAsc(assignment.getGroup().getId(), EnrollmentStatus.ACTIVE);
        for (GroupEnrollment enrollment : enrollments) {
            send(event, enrollment.getStudent(), event.type() == NotificationType.ASSIGNMENT_PUBLISHED);
        }
    }

    private void routeSubmissionStudent(NotificationDomainEvent event) {
        Submission submission = submissionRepository.findById(event.submissionId()).orElse(null);
        if (submission != null) send(event, submission.getStudent(), false);
    }

    private void send(NotificationDomainEvent event, User recipient, boolean deduplicate) {
        UUID messageId = NotificationDispatchService.deterministicId(event.eventId(), recipient.getId());
        NotificationMessage message = new NotificationMessage(
                messageId, event.type(), recipient.getId(), event.actorId(), event.groupId(),
                event.assignmentId(), event.submissionId(), event.occurredAt(), 0, 1);
        if (deduplicate) {
            String key = event.type() + ":" + event.assignmentId() + ":" + recipient.getId();
            dispatchService.sendOnceIfEnabled(key, recipient, message);
        } else {
            dispatchService.sendIfEnabled(recipient, message);
        }
    }
}
