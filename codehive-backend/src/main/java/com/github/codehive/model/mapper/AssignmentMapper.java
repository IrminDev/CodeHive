package com.github.codehive.model.mapper;

import java.util.List;

import com.github.codehive.model.dto.AssignmentDTO;
import com.github.codehive.model.entity.Assignment;

public class AssignmentMapper {
    public static AssignmentDTO toDTO(Assignment assignment) {
        if (assignment == null) {
            return null;
        }
        AssignmentDTO dto = new AssignmentDTO();
        dto.setId(assignment.getId());
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
        dto.setAllowedLanguages(assignment.getAllowedLanguages());
        dto.setIsActive(assignment.getIsActive());
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
        assignment.setAllowedLanguages(dto.getAllowedLanguages());
        assignment.setIsActive(dto.getIsActive());
        return assignment;
    }

    public static List<AssignmentDTO> toDTOList(List<Assignment> assignments) {
        return assignments.stream().map(AssignmentMapper::toDTO).toList();
    }

    public static List<Assignment> toEntityList(List<AssignmentDTO> dtos) {
        return dtos.stream().map(AssignmentMapper::toEntity).toList();
    }
}
