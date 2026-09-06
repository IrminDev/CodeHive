package com.github.codehive.model.mapper;

import com.github.codehive.model.dto.EnrollmentDTO;
import com.github.codehive.model.dto.EnrollmentStudentDTO;
import com.github.codehive.model.dto.GroupDTO;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;

public final class GroupMapper {
    private GroupMapper() {}

    public static GroupDTO toDTO(ClassGroup group, boolean includeJoinCode) {
        GroupDTO dto = new GroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setOwnerId(group.getOwner().getId());
        dto.setOwnerName(group.getOwner().getName() + " " + group.getOwner().getLastName());
        dto.setJoinCode(includeJoinCode ? group.getJoinCode() : null);
        dto.setArchived(group.getArchived());
        dto.setIsActive(group.getIsActive());
        dto.setCreatedAt(group.getCreatedAt());
        dto.setUpdatedAt(group.getUpdatedAt());
        return dto;
    }

    public static EnrollmentDTO toDTO(GroupEnrollment enrollment) {
        EnrollmentDTO dto = new EnrollmentDTO();
        dto.setId(enrollment.getId());
        dto.setGroupId(enrollment.getGroup().getId());
        dto.setStudent(new EnrollmentStudentDTO(
                enrollment.getStudent().getId(),
                enrollment.getStudent().getName() + " " + enrollment.getStudent().getLastName(),
                enrollment.getStudent().getEnrollmentNumber()));
        dto.setStatus(enrollment.getStatus());
        dto.setJoinedAt(enrollment.getJoinedAt());
        dto.setEndedAt(enrollment.getEndedAt());
        return dto;
    }
}
