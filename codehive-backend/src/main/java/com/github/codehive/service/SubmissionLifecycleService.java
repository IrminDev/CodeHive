package com.github.codehive.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class SubmissionLifecycleService {
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    public SubmissionLifecycleService(SubmissionRepository submissionRepository,
                                      UserRepository userRepository) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void withdraw(UUID submissionId, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + submissionId));
        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException("Students can only withdraw their own submissions");
        }
        if (submission.getStatus() != SubmissionStatus.SUBMITTED) {
            throw new ValidationException("Only a submitted delivery can be withdrawn");
        }
        Instant now = Instant.now();
        if (submission.getAssignment().getCloseDate() != null
                && !now.isBefore(submission.getAssignment().getCloseDate())) {
            throw new ValidationException("The assignment is closed; this submission cannot be withdrawn");
        }
        StudentAssignmentWork work = submission.getStudentWork();
        if (work == null || work.getCurrentSubmission() == null
                || !work.getCurrentSubmission().getId().equals(submission.getId())) {
            throw new ValidationException("Only the current submission can be withdrawn");
        }
        submission.setStatus(SubmissionStatus.WITHDRAWN);
        submission.setWithdrawnAt(now);
        work.setCurrentSubmission(null);
        work.setStatus(StudentWorkStatus.WITHDRAWN);
        work.setUpdatedAt(now);
    }
}
