package com.github.codehive.model.mapper;

import java.util.List;

import com.github.codehive.model.dto.SubmissionDTO;
import com.github.codehive.model.entity.Submission;

public class SubmissionMapper {
    public static SubmissionDTO toDTO(Submission submission) {
        if (submission == null) {
            return null;
        }
        SubmissionDTO dto = new SubmissionDTO();
        dto.setId(submission.getId());
        dto.setAssignmentId(submission.getAssignment() != null ? 
            submission.getAssignment().getId() : null);
        dto.setLanguage(submission.getLanguage());
        dto.setCreatedAt(submission.getCreatedAt());
        dto.setStudentId(submission.getStudent() != null ? submission.getStudent().getId() : null);
        dto.setDeliveredLate(submission.getDeliveredLate());
        dto.setStudentWorkId(submission.getStudentWork() != null ? submission.getStudentWork().getId() : null);
        dto.setStatus(submission.getStatus());
        dto.setWithdrawnAt(submission.getWithdrawnAt());
        return dto;
    }

    public static Submission toEntity(SubmissionDTO dto) {
        if (dto == null) {
            return null;
        }
        Submission submission = new Submission();
        submission.setId(dto.getId());
        // Note: Assignment must be set separately via assignment repository
        submission.setLanguage(dto.getLanguage());
        submission.setCreatedAt(dto.getCreatedAt());
        submission.setDeliveredLate(dto.getDeliveredLate());
        submission.setStatus(dto.getStatus());
        submission.setWithdrawnAt(dto.getWithdrawnAt());
        return submission;
    }

    public static List<SubmissionDTO> toDTOList(List<Submission> submissions) {
        return submissions.stream().map(SubmissionMapper::toDTO).toList();
    }

    public static List<Submission> toEntityList(List<SubmissionDTO> dtos) {
        return dtos.stream().map(SubmissionMapper::toEntity).toList();
    }
}
