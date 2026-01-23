package com.github.codehive.model.mapper;

import java.util.List;

import com.github.codehive.model.dto.ReferenceSolutionDTO;
import com.github.codehive.model.entity.ReferenceSolution;

public class ReferenceSolutionMapper {
    public static ReferenceSolutionDTO toDTO(ReferenceSolution referenceSolution) {
        if (referenceSolution == null) {
            return null;
        }
        ReferenceSolutionDTO dto = new ReferenceSolutionDTO();
        dto.setId(referenceSolution.getId());
        dto.setAssignmentId(referenceSolution.getAssignment() != null ? 
            referenceSolution.getAssignment().getId() : null);
        dto.setLanguage(referenceSolution.getLanguage());
        return dto;
    }

    public static ReferenceSolution toEntity(ReferenceSolutionDTO dto) {
        if (dto == null) {
            return null;
        }
        ReferenceSolution referenceSolution = new ReferenceSolution();
        referenceSolution.setId(dto.getId());
        // Note: Assignment must be set separately via assignment repository
        referenceSolution.setLanguage(dto.getLanguage());
        return referenceSolution;
    }

    public static List<ReferenceSolutionDTO> toDTOList(List<ReferenceSolution> referenceSolutions) {
        return referenceSolutions.stream().map(ReferenceSolutionMapper::toDTO).toList();
    }

    public static List<ReferenceSolution> toEntityList(List<ReferenceSolutionDTO> dtos) {
        return dtos.stream().map(ReferenceSolutionMapper::toEntity).toList();
    }
}
