package com.github.codehive.model.dto;

import java.util.UUID;

import com.github.codehive.model.enums.StudentWorkStatus;

/** Assignment plus authenticated-student progress used by dashboard, assignments, and grades. */
public record StudentAssignmentOverviewDTO(
        AssignmentDTO assignment,
        UUID groupId,
        String groupName,
        boolean groupArchived,
        StudentWorkStatus workStatus,
        StudentGroupSubmissionDTO currentSubmission,
        AssignmentGradeDTO grade,
        long feedbackCount
) {}
