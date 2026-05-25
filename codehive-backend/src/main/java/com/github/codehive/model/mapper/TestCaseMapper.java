package com.github.codehive.model.mapper;

import java.util.List;

import com.github.codehive.model.dto.TestCaseDTO;
import com.github.codehive.model.entity.TestCase;

public class TestCaseMapper {
    public static TestCaseDTO toDTO(TestCase testCase) {
        if (testCase == null) {
            return null;
        }
        TestCaseDTO dto = new TestCaseDTO();
        dto.setId(testCase.getId());
        dto.setAssignmentId(testCase.getAssignment() != null ? 
            testCase.getAssignment().getId() : null);
        dto.setOrder(testCase.getOrder());
        dto.setIsSample(testCase.getIsSample());
        return dto;
    }

    public static TestCase toEntity(TestCaseDTO dto) {
        if (dto == null) {
            return null;
        }
        TestCase testCase = new TestCase();
        testCase.setId(dto.getId());
        // Note: Assignment must be set separately via assignment repository
        testCase.setOrder(dto.getOrder());
        testCase.setIsSample(dto.getIsSample());
        return testCase;
    }

    public static List<TestCaseDTO> toDTOList(List<TestCase> testCases) {
        return testCases.stream().map(TestCaseMapper::toDTO).toList();
    }

    public static List<TestCase> toEntityList(List<TestCaseDTO> dtos) {
        return dtos.stream().map(TestCaseMapper::toEntity).toList();
    }
}
