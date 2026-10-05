package com.github.codehive.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.admin.AdminStatisticsDTO;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.RateLimitIncidentRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class AdminStatisticsService {
    private final UserRepository userRepository;
    private final ClassGroupRepository groupRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;
    private final RateLimitIncidentRepository incidentRepository;

    public AdminStatisticsService(UserRepository userRepository,
                                  ClassGroupRepository groupRepository,
                                  AssignmentRepository assignmentRepository,
                                  SubmissionRepository submissionRepository,
                                  ExecutionRepository executionRepository,
                                  RateLimitIncidentRepository incidentRepository) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
        this.incidentRepository = incidentRepository;
    }

    @Transactional(readOnly = true)
    public AdminStatisticsDTO get(Instant from, Instant to) {
        Instant effectiveTo = to == null ? Instant.now() : to;
        Instant effectiveFrom = from == null ? effectiveTo.minusSeconds(30L * 24 * 60 * 60) : from;
        if (!effectiveFrom.isBefore(effectiveTo)) {
            throw new com.github.codehive.model.exception.ValidationException("from must be before to");
        }
        LocalDateTime localFrom = LocalDateTime.ofInstant(effectiveFrom, ZoneOffset.UTC);
        LocalDateTime localTo = LocalDateTime.ofInstant(effectiveTo, ZoneOffset.UTC);

        long visible = userRepository.countByIsActiveTrue();
        long blocked = userRepository.countByIsActiveTrueAndBlockedTrue();
        AdminStatisticsDTO.UserStatistics users = new AdminStatisticsDTO.UserStatistics(
                visible, userRepository.countByIsActiveTrueAndBlockedFalse(), blocked,
                userRepository.countByRoleAndIsActiveTrue(Role.STUDENT),
                userRepository.countByRoleAndIsActiveTrue(Role.TEACHER),
                userRepository.countByRoleAndIsActiveTrue(Role.ADMIN),
                userRepository.countByCreatedAtBetweenAndIsActiveTrue(localFrom, localTo));

        AdminStatisticsDTO.ResourceStatistics resources = new AdminStatisticsDTO.ResourceStatistics(
                groupRepository.countByIsActiveTrueAndArchivedFalse(),
                groupRepository.countByIsActiveTrueAndArchivedTrue(),
                assignmentRepository.countOperationallyActive(),
                submissionRepository.countVisibleInPeriod(localFrom, localTo),
                executionRepository.countVisibleInPeriod(localFrom, localTo));

        Map<String, Long> assignmentValidation = new LinkedHashMap<>();
        for (AssignmentValidationStatus status : AssignmentValidationStatus.values()) {
            assignmentValidation.put(status.name(), assignmentRepository.countVisibleByValidationStatus(status));
        }
        Map<String, Long> executionVerdicts = new LinkedHashMap<>();
        for (ExecutionStatus status : ExecutionStatus.values()) {
            executionVerdicts.put(status.name(), executionRepository.countVisibleByStatus(status));
        }
        return new AdminStatisticsDTO(Instant.now(), effectiveFrom, effectiveTo, users, resources,
                assignmentValidation, executionVerdicts,
                incidentRepository.countByOccurredAtBetweenAndUserIsActiveTrue(effectiveFrom, effectiveTo));
    }
}
