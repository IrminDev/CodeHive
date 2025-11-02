package com.github.codehive.model.mapper;

import java.util.List;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.entity.User;

public class UserMapper {
    public static UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setLastName(user.getLastName());
        dto.setEnrollmentNumber(user.getEnrollmentNumber());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setIsActive(user.getIsActive());
        return dto;
    }

    public static User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }
        User user = new User();
        user.setId(dto.getId());
        user.setEmail(dto.getEmail());
        user.setName(dto.getName());
        user.setLastName(dto.getLastName());
        user.setEnrollmentNumber(dto.getEnrollmentNumber());
        user.setProfilePictureUrl(dto.getProfilePictureUrl());
        user.setRole(dto.getRole());
        user.setCreatedAt(dto.getCreatedAt());
        user.setIsActive(dto.getIsActive());
        return user;
    }

    public static List<UserDTO> toDTOList(List<User> users) {
        return users.stream().map(UserMapper::toDTO).toList();
    }

    public static List<User> toEntityList(List<UserDTO> dtos) {
        return dtos.stream().map(UserMapper::toEntity).toList();
    }
}
