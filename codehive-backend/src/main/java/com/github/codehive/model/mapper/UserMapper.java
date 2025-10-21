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
        dto.setEnrollmentNumber(user.getEnrollmentNumber());
        dto.setName(user.getName());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());;
        return dto;
    }

    public static User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }
        User user = new User();
        user.setId(dto.getId());
        user.setEmail(dto.getEmail());
        user.setEnrollmentNumber(dto.getEnrollmentNumber());
        user.setName(dto.getName());
        user.setProfilePictureUrl(dto.getProfilePictureUrl());
        return user;
    }

    public static List<UserDTO> toDTOList(List<User> users) {
        return users.stream().map(UserMapper::toDTO).toList();
    }

    public static List<User> toEntityList(List<UserDTO> dtos) {
        return dtos.stream().map(UserMapper::toEntity).toList();
    }
}
