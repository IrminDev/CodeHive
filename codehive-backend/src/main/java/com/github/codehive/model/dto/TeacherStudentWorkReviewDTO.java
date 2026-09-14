package com.github.codehive.model.dto;

import java.util.List;

public record TeacherStudentWorkReviewDTO(
        StudentAssignmentWorkDTO work,
        List<AssignmentGradeHistoryDTO> gradeHistory,
        List<TeacherSubmissionEvidenceDTO> submissions) {
}
