package com.github.codehive.model.mapper;

import java.util.List;

import com.github.codehive.model.dto.AssignmentDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.dto.AssignmentExampleDTO;

public class AssignmentMapper {
    public static AssignmentDTO toDTO(Assignment assignment) {
        if (assignment == null) {
            return null;
        }
        AssignmentDTO dto = new AssignmentDTO();
        dto.setId(assignment.getId());
        dto.setGroupId(assignment.getGroup() != null ? assignment.getGroup().getId() : null);
        dto.setAuthorId(assignment.getAuthor() != null ? assignment.getAuthor().getId() : null);
        dto.setTitle(assignment.getTitle());
        dto.setDescription(assignment.getDescription());
        dto.setConstraints(assignment.getConstraints());
        dto.setHints(assignment.getHints());
        dto.setTags(assignment.getTags());
        dto.setTimeLimitMs(assignment.getTimeLimitMs());
        dto.setMemoryLimitMb(assignment.getMemoryLimitMb());
        dto.setComparatorType(assignment.getComparatorType());
        dto.setCreatedAt(assignment.getCreatedAt());
        dto.setUpdatedAt(assignment.getUpdatedAt());
        dto.setDueDate(assignment.getDueDate());
        dto.setLaunchDate(assignment.getLaunchDate());
        dto.setCloseDate(assignment.getCloseDate());
        dto.setAllowedLanguages(assignment.getAllowedLanguages());
        dto.setIsActive(assignment.getIsActive());
        dto.setValidationStatus(assignment.getValidationStatus());
        dto.setMaxPoints(assignment.getMaxPoints());
        dto.setActiveTestSuiteRevisionId(assignment.getActiveTestSuiteRevision() != null
                ? assignment.getActiveTestSuiteRevision().getId() : null);
        dto.setActiveReferenceSolutionRevisionId(assignment.getActiveReferenceSolutionRevision() != null
                ? assignment.getActiveReferenceSolutionRevision().getId() : null);
        dto.setExamples(assignment.getExamples().stream().map(example -> {
            AssignmentExampleDTO result = new AssignmentExampleDTO();
            result.setId(example.getId());
            result.setOrder(example.getOrder());
            result.setInput(example.getInput());
            result.setOutput(example.getOutput());
            result.setExplanation(example.getExplanation());
            return result;
        }).toList());
        return dto;
    }

    public static Assignment toEntity(AssignmentDTO dto) {
        if (dto == null) {
            return null;
        }
        Assignment assignment = new Assignment();
        assignment.setId(dto.getId());
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setConstraints(dto.getConstraints());
        assignment.setHints(dto.getHints());
        assignment.setTags(dto.getTags());
        assignment.setTimeLimitMs(dto.getTimeLimitMs());
        assignment.setMemoryLimitMb(dto.getMemoryLimitMb());
        assignment.setComparatorType(dto.getComparatorType());
        assignment.setCreatedAt(dto.getCreatedAt());
        assignment.setUpdatedAt(dto.getUpdatedAt());
        assignment.setDueDate(dto.getDueDate());
        assignment.setLaunchDate(dto.getLaunchDate());
        assignment.setCloseDate(dto.getCloseDate());
        assignment.setAllowedLanguages(dto.getAllowedLanguages());
        assignment.setIsActive(dto.getIsActive());
        assignment.setValidationStatus(dto.getValidationStatus());
        assignment.setMaxPoints(dto.getMaxPoints());
        return assignment;
    }

    public static List<AssignmentDTO> toDTOList(List<Assignment> assignments) {
        return assignments.stream().map(AssignmentMapper::toDTO).toList();
    }

    public static List<Assignment> toEntityList(List<AssignmentDTO> dtos) {
        return dtos.stream().map(AssignmentMapper::toEntity).toList();
    }
}
