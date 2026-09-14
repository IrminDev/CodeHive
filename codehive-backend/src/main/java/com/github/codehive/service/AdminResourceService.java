package com.github.codehive.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.admin.AdminAssignmentResourceDTO;
import com.github.codehive.model.dto.admin.AdminExecutionResourceDTO;
import com.github.codehive.model.dto.admin.AdminGroupResourceDTO;
import com.github.codehive.model.dto.admin.AdminSubmissionResourceDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class AdminResourceService {
    public enum GroupRelationship { OWNED, ENROLLED }
    public enum AssignmentRelationship { AUTHORED, PARTICIPATED }

    private final UserRepository userRepository;
    private final ClassGroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;

    public AdminResourceService(UserRepository userRepository,
                                ClassGroupRepository groupRepository,
                                GroupEnrollmentRepository enrollmentRepository,
                                AssignmentRepository assignmentRepository,
                                StudentAssignmentWorkRepository workRepository,
                                SubmissionRepository submissionRepository,
                                ExecutionRepository executionRepository) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.workRepository = workRepository;
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminGroupResourceDTO> groups(UUID userId, GroupRelationship relationship,
                                              int page, int size) {
        requireVisibleUser(userId);
        if (relationship == GroupRelationship.ENROLLED) {
            return enrollmentRepository.findByStudentId(userId,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "group.createdAt")))
                    .map(this::enrolledGroup);
        }
        return groupRepository.findByOwnerId(userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::ownedGroup);
    }

    @Transactional(readOnly = true)
    public Page<AdminAssignmentResourceDTO> assignments(UUID userId,
                                                         AssignmentRelationship relationship,
                                                         int page, int size) {
        requireVisibleUser(userId);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (relationship == AssignmentRelationship.PARTICIPATED) {
            return workRepository.findByStudentId(userId, pageable).map(this::participatedAssignment);
        }
        return assignmentRepository.findByAuthorId(userId, pageable).map(this::authoredAssignment);
    }

    @Transactional(readOnly = true)
    public Page<AdminSubmissionResourceDTO> submissions(UUID userId, int page, int size) {
        requireVisibleUser(userId);
        return submissionRepository.findByStudentId(userId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::submission);
    }

    @Transactional(readOnly = true)
    public Page<AdminExecutionResourceDTO> executions(UUID userId, int page, int size) {
        requireVisibleUser(userId);
        return executionRepository.findByUserId(userId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::execution);
    }

    private AdminGroupResourceDTO ownedGroup(ClassGroup group) {
        return new AdminGroupResourceDTO(group.getId(), group.getName(), GroupRelationship.OWNED.name(),
                Boolean.TRUE.equals(group.getIsActive()), Boolean.TRUE.equals(group.getArchived()),
                group.getCreatedAt(), group.getDeletionReason(), null, null, null);
    }

    private AdminGroupResourceDTO enrolledGroup(GroupEnrollment enrollment) {
        ClassGroup group = enrollment.getGroup();
        return new AdminGroupResourceDTO(group.getId(), group.getName(), GroupRelationship.ENROLLED.name(),
                Boolean.TRUE.equals(group.getIsActive()), Boolean.TRUE.equals(group.getArchived()),
                group.getCreatedAt(), group.getDeletionReason(), enrollment.getStatus(),
                enrollment.getJoinedAt(), enrollment.getEndedAt());
    }

    private AdminAssignmentResourceDTO authoredAssignment(Assignment assignment) {
        return assignment(assignment, AssignmentRelationship.AUTHORED.name(), null);
    }

    private AdminAssignmentResourceDTO participatedAssignment(StudentAssignmentWork work) {
        return assignment(work.getAssignment(), AssignmentRelationship.PARTICIPATED.name(), work.getStatus());
    }

    private AdminAssignmentResourceDTO assignment(Assignment assignment, String relationship,
                                                   com.github.codehive.model.enums.StudentWorkStatus workStatus) {
        return new AdminAssignmentResourceDTO(assignment.getId(), assignment.getTitle(),
                assignment.getGroup().getId(), assignment.getGroup().getName(), relationship,
                Boolean.TRUE.equals(assignment.getIsActive()), assignment.getValidationStatus(),
                assignment.getLaunchDate(), assignment.getDueDate(), assignment.getCloseDate(),
                assignment.getCreatedAt(), assignment.getUpdatedAt(), workStatus);
    }

    private AdminSubmissionResourceDTO submission(Submission submission) {
        Assignment assignment = submission.getAssignment();
        Execution latest = executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(submission.getId())
                .orElse(null);
        return new AdminSubmissionResourceDTO(submission.getId(), assignment.getId(), assignment.getTitle(),
                assignment.getGroup().getId(), assignment.getGroup().getName(), submission.getLanguage(),
                submission.getStatus(), Boolean.TRUE.equals(submission.getDeliveredLate()),
                submission.getCreatedAt(), submission.getWithdrawnAt(), latest == null ? null : latest.getStatus());
    }

    private AdminExecutionResourceDTO execution(Execution execution) {
        UUID assignmentId = execution.getAssignment() == null ? null : execution.getAssignment().getId();
        if (assignmentId == null && execution.getSubmission() != null) {
            assignmentId = execution.getSubmission().getAssignment().getId();
        }
        return new AdminExecutionResourceDTO(execution.getId(), assignmentId,
                execution.getSubmission() == null ? null : execution.getSubmission().getId(),
                execution.getExecutionType(), execution.getTrigger(), execution.getStatus(),
                execution.getTimeMs(), execution.getMemoryMb(), execution.getCreatedAt(),
                execution.getArtifactsPurgedAt() == null
                        && execution.getStatus() != com.github.codehive.model.enums.ExecutionStatus.PENDING);
    }

    private User requireVisibleUser(UUID id) {
        return userRepository.findById(id).filter(User::isApplicationVisible)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }
}
