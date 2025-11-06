package com.github.codehive.model.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;

@DisplayName("UserMapper Unit Tests")
class UserMapperTest {

    private User testUser;
    private UserDTO testUserDTO;
    private LocalDateTime testDate;

    @BeforeEach
    void setUp() {
        testDate = LocalDateTime.now();

        // Setup test user entity
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setName("John");
        testUser.setLastName("Doe");
        testUser.setEnrollmentNumber("ENR001");
        testUser.setProfilePictureUrl("https://example.com/pic.jpg");
        testUser.setRole(Role.STUDENT);
        testUser.setCreatedAt(testDate);
        testUser.setIsActive(true);
        testUser.setPassword("encodedPassword"); // Should not be mapped to DTO

        // Setup test user DTO
        testUserDTO = new UserDTO();
        testUserDTO.setId(2L);
        testUserDTO.setEmail("jane@example.com");
        testUserDTO.setName("Jane");
        testUserDTO.setLastName("Smith");
        testUserDTO.setEnrollmentNumber("ENR002");
        testUserDTO.setProfilePictureUrl("https://example.com/jane.jpg");
        testUserDTO.setRole(Role.TEACHER);
        testUserDTO.setCreatedAt(testDate);
        testUserDTO.setIsActive(false);
    }

    @Nested
    @DisplayName("Entity to DTO Mapping Tests")
    class EntityToDTOTests {

        @Test
        @DisplayName("Should map all fields from User to UserDTO")
        void toDTO_WithCompleteUser_MapsAllFields() {
            // When
            UserDTO result = UserMapper.toDTO(testUser);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(testUser.getId());
            assertThat(result.getEmail()).isEqualTo(testUser.getEmail());
            assertThat(result.getName()).isEqualTo(testUser.getName());
            assertThat(result.getLastName()).isEqualTo(testUser.getLastName());
            assertThat(result.getEnrollmentNumber()).isEqualTo(testUser.getEnrollmentNumber());
            assertThat(result.getProfilePictureUrl()).isEqualTo(testUser.getProfilePictureUrl());
            assertThat(result.getRole()).isEqualTo(testUser.getRole());
            assertThat(result.getCreatedAt()).isEqualTo(testUser.getCreatedAt());
            assertThat(result.getIsActive()).isEqualTo(testUser.getIsActive());
        }

        @Test
        @DisplayName("Should return null when User is null")
        void toDTO_WithNullUser_ReturnsNull() {
            // When
            UserDTO result = UserMapper.toDTO(null);

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should handle user with minimal fields")
        void toDTO_WithMinimalUser_MapsAvailableFields() {
            // Given
            User minimalUser = new User();
            minimalUser.setId(999L);
            minimalUser.setEmail("minimal@example.com");

            // When
            UserDTO result = UserMapper.toDTO(minimalUser);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(999L);
            assertThat(result.getEmail()).isEqualTo("minimal@example.com");
            assertThat(result.getName()).isNull();
            assertThat(result.getLastName()).isNull();
        }

        @Test
        @DisplayName("Should map different role types correctly")
        void toDTO_WithDifferentRoles_MapsRoleCorrectly() {
            // Test STUDENT role
            testUser.setRole(Role.STUDENT);
            UserDTO studentDTO = UserMapper.toDTO(testUser);
            assertThat(studentDTO.getRole()).isEqualTo(Role.STUDENT);

            // Test TEACHER role
            testUser.setRole(Role.TEACHER);
            UserDTO teacherDTO = UserMapper.toDTO(testUser);
            assertThat(teacherDTO.getRole()).isEqualTo(Role.TEACHER);

            // Test ADMIN role
            testUser.setRole(Role.ADMIN);
            UserDTO adminDTO = UserMapper.toDTO(testUser);
            assertThat(adminDTO.getRole()).isEqualTo(Role.ADMIN);
        }

        @Test
        @DisplayName("Should handle active and inactive users")
        void toDTO_WithDifferentActiveStates_MapsCorrectly() {
            // Test active user
            testUser.setIsActive(true);
            UserDTO activeDTO = UserMapper.toDTO(testUser);
            assertThat(activeDTO.getIsActive()).isTrue();

            // Test inactive user
            testUser.setIsActive(false);
            UserDTO inactiveDTO = UserMapper.toDTO(testUser);
            assertThat(inactiveDTO.getIsActive()).isFalse();
        }
    }

    @Nested
    @DisplayName("DTO to Entity Mapping Tests")
    class DTOToEntityTests {

        @Test
        @DisplayName("Should map all fields from UserDTO to User")
        void toEntity_WithCompleteDTO_MapsAllFields() {
            // When
            User result = UserMapper.toEntity(testUserDTO);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(testUserDTO.getId());
            assertThat(result.getEmail()).isEqualTo(testUserDTO.getEmail());
            assertThat(result.getName()).isEqualTo(testUserDTO.getName());
            assertThat(result.getLastName()).isEqualTo(testUserDTO.getLastName());
            assertThat(result.getEnrollmentNumber()).isEqualTo(testUserDTO.getEnrollmentNumber());
            assertThat(result.getProfilePictureUrl()).isEqualTo(testUserDTO.getProfilePictureUrl());
            assertThat(result.getRole()).isEqualTo(testUserDTO.getRole());
            assertThat(result.getCreatedAt()).isEqualTo(testUserDTO.getCreatedAt());
            assertThat(result.getIsActive()).isEqualTo(testUserDTO.getIsActive());
        }

        @Test
        @DisplayName("Should return null when UserDTO is null")
        void toEntity_WithNullDTO_ReturnsNull() {
            // When
            User result = UserMapper.toEntity(null);

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should handle DTO with minimal fields")
        void toEntity_WithMinimalDTO_MapsAvailableFields() {
            // Given
            UserDTO minimalDTO = new UserDTO();
            minimalDTO.setId(888L);
            minimalDTO.setEmail("minimal@example.com");

            // When
            User result = UserMapper.toEntity(minimalDTO);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(888L);
            assertThat(result.getEmail()).isEqualTo("minimal@example.com");
            assertThat(result.getName()).isNull();
            assertThat(result.getPassword()).isNull();
        }
    }

    @Nested
    @DisplayName("List Mapping Tests")
    class ListMappingTests {

        @Test
        @DisplayName("Should map list of Users to list of UserDTOs")
        void toDTOList_WithMultipleUsers_MapsAllCorrectly() {
            // Given
            User user1 = new User();
            user1.setId(1L);
            user1.setEmail("user1@example.com");
            user1.setName("User");
            user1.setLastName("One");
            
            User user2 = new User();
            user2.setId(2L);
            user2.setEmail("user2@example.com");
            user2.setName("User");
            user2.setLastName("Two");

            List<User> users = Arrays.asList(user1, user2);

            // When
            List<UserDTO> result = UserMapper.toDTOList(users);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getId()).isEqualTo(1L);
            assertThat(result.get(0).getEmail()).isEqualTo("user1@example.com");
            assertThat(result.get(1).getId()).isEqualTo(2L);
            assertThat(result.get(1).getEmail()).isEqualTo("user2@example.com");
        }

        @Test
        @DisplayName("Should return empty list when input list is empty")
        void toDTOList_WithEmptyList_ReturnsEmptyList() {
            // When
            List<UserDTO> result = UserMapper.toDTOList(List.of());

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should map list of UserDTOs to list of Users")
        void toEntityList_WithMultipleDTOs_MapsAllCorrectly() {
            // Given
            UserDTO dto1 = new UserDTO();
            dto1.setId(10L);
            dto1.setEmail("dto1@example.com");
            
            UserDTO dto2 = new UserDTO();
            dto2.setId(20L);
            dto2.setEmail("dto2@example.com");

            List<UserDTO> dtos = Arrays.asList(dto1, dto2);

            // When
            List<User> result = UserMapper.toEntityList(dtos);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getId()).isEqualTo(10L);
            assertThat(result.get(0).getEmail()).isEqualTo("dto1@example.com");
            assertThat(result.get(1).getId()).isEqualTo(20L);
            assertThat(result.get(1).getEmail()).isEqualTo("dto2@example.com");
        }

        @Test
        @DisplayName("Should handle list containing null values")
        void toDTOList_WithNullValuesInList_SkipsNulls() {
            // Given
            User user1 = new User();
            user1.setId(1L);
            user1.setEmail("user1@example.com");

            List<User> users = Arrays.asList(user1, null);

            // When
            List<UserDTO> result = UserMapper.toDTOList(users);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0)).isNotNull();
            assertThat(result.get(1)).isNull();
        }
    }

    @Nested
    @DisplayName("Round-trip Mapping Tests")
    class RoundTripTests {

        @Test
        @DisplayName("Should preserve data through Entity -> DTO -> Entity conversion")
        void roundTrip_EntityToDTOToEntity_PreservesData() {
            // When
            UserDTO dto = UserMapper.toDTO(testUser);
            User resultEntity = UserMapper.toEntity(dto);

            // Then
            assertThat(resultEntity.getId()).isEqualTo(testUser.getId());
            assertThat(resultEntity.getEmail()).isEqualTo(testUser.getEmail());
            assertThat(resultEntity.getName()).isEqualTo(testUser.getName());
            assertThat(resultEntity.getLastName()).isEqualTo(testUser.getLastName());
            assertThat(resultEntity.getEnrollmentNumber()).isEqualTo(testUser.getEnrollmentNumber());
            assertThat(resultEntity.getRole()).isEqualTo(testUser.getRole());
            assertThat(resultEntity.getIsActive()).isEqualTo(testUser.getIsActive());
        }

        @Test
        @DisplayName("Should preserve data through DTO -> Entity -> DTO conversion")
        void roundTrip_DTOToEntityToDTO_PreservesData() {
            // When
            User entity = UserMapper.toEntity(testUserDTO);
            UserDTO resultDTO = UserMapper.toDTO(entity);

            // Then
            assertThat(resultDTO.getId()).isEqualTo(testUserDTO.getId());
            assertThat(resultDTO.getEmail()).isEqualTo(testUserDTO.getEmail());
            assertThat(resultDTO.getName()).isEqualTo(testUserDTO.getName());
            assertThat(resultDTO.getLastName()).isEqualTo(testUserDTO.getLastName());
            assertThat(resultDTO.getEnrollmentNumber()).isEqualTo(testUserDTO.getEnrollmentNumber());
            assertThat(resultDTO.getRole()).isEqualTo(testUserDTO.getRole());
            assertThat(resultDTO.getIsActive()).isEqualTo(testUserDTO.getIsActive());
        }
    }
}
