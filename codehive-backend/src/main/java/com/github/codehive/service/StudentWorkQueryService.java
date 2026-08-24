package com.github.codehive.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.AssignmentGradeDTO;
import com.github.codehive.model.dto.StudentAssignmentWorkDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.mapper.SubmissionMapper;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class StudentWorkQueryService {
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final SubmissionRepository submissionRepository;
    private final AssignmentGradeRepository gradeRepository;
    private final UserRepository userRepository;

    public StudentWorkQueryService(AssignmentRepository assignmentRepository,
                                   StudentAssignmentWorkRepository workRepository,
                                   SubmissionRepository submissionRepository,
                                   AssignmentGradeRepository gradeRepository,
                                   UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.workRepository = workRepository;
        this.submissionRepository = submissionRepository;
        this.gradeRepository = gradeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentAssignmentWorkDTO> list(UUID assignmentId, String email) {
        User teacher = requireUser(email);
        requireOwnedAssignment(assignmentId, teacher);
        return workRepository.findByAssignmentId(assignmentId).stream()
                .filter(work -> work.getStudent().canParticipate())
                .map(work -> toDTO(work, true)).toList();
    }

    @Transactional(readOnly = true)
    public StudentAssignmentWorkDTO get(UUID assignmentId, UUID studentId, String email) {
        User caller = requireUser(email);
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));
        boolean ownerView = assignment.getGroup().getOwner().getId().equals(caller.getId());
        if (!ownerView && !caller.getId().equals(studentId)) {
            throw new AccessDeniedException("Students can only view their own work");
        }
        StudentAssignmentWork work = workRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student assignment work not found"));
        if (!work.getStudent().canParticipate()) {
            throw new EntityNotFoundException("Student assignment work not found");
        }
        return toDTO(work, ownerView);
    }

    @Transactional(readOnly = true)
    public StudentAssignmentWorkDTO getMine(UUID assignmentId, String email) {
        User student = requireUser(email);
        return get(assignmentId, student.getId(), email);
    }

    private StudentAssignmentWorkDTO toDTO(StudentAssignmentWork work, boolean teacherView) {
        AssignmentGrade grade = gradeRepository.findByStudentWorkId(work.getId())
                .filter(item -> teacherView || item.getStatus() == GradeStatus.RETURNED)
                .orElse(null);
        return new StudentAssignmentWorkDTO(
                work.getId(), work.getAssignment().getId(), work.getStudent().getId(),
                work.getCurrentSubmission() != null ? work.getCurrentSubmission().getId() : null,
                work.getStatus(), grade != null ? gradeDTO(grade) : null,
                SubmissionMapper.toDTOList(submissionRepository
                        .findByAssignmentAndStudentOrderByCreatedAtDesc(
                                work.getAssignment(), work.getStudent())),
                work.getUpdatedAt());
    }

    private AssignmentGradeDTO gradeDTO(AssignmentGrade grade) {
        StudentAssignmentWork work = grade.getStudentWork();
        return new AssignmentGradeDTO(
                grade.getId(), work.getAssignment().getId(), work.getStudent().getId(),
                grade.getGradedSubmission() != null ? grade.getGradedSubmission().getId() : null,
                grade.getValue(), grade.getMaxPointsSnapshot(), grade.getStatus(),
                grade.getUpdatedAt(), grade.getReturnedAt());
    }

    private Assignment requireOwnedAssignment(UUID id, User teacher) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + id));
        if (!teacher.canManageGroups() || !assignment.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can view the gradebook");
        }
        return assignment;
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }
}
