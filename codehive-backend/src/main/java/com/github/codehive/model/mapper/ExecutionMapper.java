package com.github.codehive.model.mapper;

import java.util.List;

import com.github.codehive.model.dto.ExecutionDTO;
import com.github.codehive.model.entity.Execution;

public class ExecutionMapper {
    public static ExecutionDTO toDTO(Execution execution) {
        if (execution == null) {
            return null;
        }
        ExecutionDTO dto = new ExecutionDTO();
        dto.setId(execution.getId());
        dto.setSubmissionId(execution.getSubmission() != null ? 
            execution.getSubmission().getId() : null);
        dto.setExecutionType(execution.getExecutionType());
        dto.setStatus(execution.getStatus());
        dto.setTimeMs(execution.getTimeMs());
        dto.setMemoryMb(execution.getMemoryMb());
        dto.setIsOutdated(execution.getIsOutdated());
        dto.setCreatedAt(execution.getCreatedAt());
        return dto;
    }

    public static Execution toEntity(ExecutionDTO dto) {
        if (dto == null) {
            return null;
        }
        Execution execution = new Execution();
        execution.setId(dto.getId());
        // Note: Submission must be set separately via submission repository
        execution.setExecutionType(dto.getExecutionType());
        execution.setStatus(dto.getStatus());
        execution.setTimeMs(dto.getTimeMs());
        execution.setMemoryMb(dto.getMemoryMb());
        execution.setIsOutdated(dto.getIsOutdated());
        execution.setCreatedAt(dto.getCreatedAt());
        return execution;
    }

    public static List<ExecutionDTO> toDTOList(List<Execution> executions) {
        return executions.stream().map(ExecutionMapper::toDTO).toList();
    }

    public static List<Execution> toEntityList(List<ExecutionDTO> dtos) {
        return dtos.stream().map(ExecutionMapper::toEntity).toList();
    }
}
