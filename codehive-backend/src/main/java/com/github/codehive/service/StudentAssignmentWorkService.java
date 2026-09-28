package com.github.codehive.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;

@Service
public class StudentAssignmentWorkService {
    private final StudentAssignmentWorkRepository repository;
    private final GroupEnrollmentRepository enrollmentRepository;

    public StudentAssignmentWorkService(StudentAssignmentWorkRepository repository,
                                        GroupEnrollmentRepository enrollmentRepository) {
        this.repository = repository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional
    public StudentAssignmentWork getOrCreate(Assignment assignment, User student) {
        return repository.findByAssignmentIdAndStudentId(assignment.getId(), student.getId())
                .orElseGet(() -> {
                    if (!enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                            assignment.getGroup().getId(), student.getId(), EnrollmentStatus.ACTIVE)) {
                        throw new ValidationException("Student is not actively enrolled in this assignment group");
                    }
                    StudentAssignmentWork work = new StudentAssignmentWork();
                    work.setAssignment(assignment);
                    work.setStudent(student);
                    work.setUpdatedAt(Instant.now());
                    return repository.save(work);
                });
    }
}
