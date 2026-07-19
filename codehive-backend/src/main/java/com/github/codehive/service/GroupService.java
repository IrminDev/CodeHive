package com.github.codehive.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.EnrollmentDTO;
import com.github.codehive.model.dto.GroupDTO;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.mapper.GroupMapper;
import com.github.codehive.model.request.group.CreateGroupRequest;
import com.github.codehive.model.request.group.UpdateGroupRequest;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class GroupService {
    private static final String JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int JOIN_CODE_LENGTH = 8;
    private final SecureRandom secureRandom = new SecureRandom();

    private final ClassGroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public GroupService(ClassGroupRepository groupRepository, GroupEnrollmentRepository enrollmentRepository,
                        UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public GroupDTO create(CreateGroupRequest request, String email) {
        User owner = requireUser(email);
        if (owner.getRole() != Role.TEACHER) {
            throw new AccessDeniedException("Only teachers can own groups");
        }
        ClassGroup group = groupRepository.save(new ClassGroup(
                request.getName().trim(), request.getDescription(), owner, generateJoinCode()));
        return GroupMapper.toDTO(group, true);
    }

    @Transactional(readOnly = true)
    public List<GroupDTO> listMine(String email, boolean includeDeleted) {
        User user = requireUser(email);
        if (user.getRole() == Role.TEACHER) {
            List<ClassGroup> groups = includeDeleted
                    ? groupRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId())
                    : groupRepository.findByOwnerIdAndIsActiveTrueOrderByCreatedAtDesc(user.getId());
            return groups.stream().map(group -> GroupMapper.toDTO(group, true)).toList();
        }
        if (user.getRole() == Role.STUDENT) {
            return enrollmentRepository.findByStudentIdAndStatus(user.getId(), EnrollmentStatus.ACTIVE).stream()
                    .map(GroupEnrollment::getGroup)
                    .filter(group -> Boolean.TRUE.equals(group.getIsActive()))
                    .map(group -> GroupMapper.toDTO(group, false)).toList();
        }
        throw new AccessDeniedException("Group administration requires a scope that is not defined yet");
    }

    @Transactional(readOnly = true)
    public GroupDTO get(UUID id, String email) {
        User user = requireUser(email);
        ClassGroup group = requireGroup(id);
        boolean owner = group.getOwner().getId().equals(user.getId());
        boolean enrolled = enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                id, user.getId(), EnrollmentStatus.ACTIVE);
        if (!owner && !enrolled) throw new AccessDeniedException("You cannot access this group");
        if (!owner && !Boolean.TRUE.equals(group.getIsActive())) {
            throw new EntityNotFoundException("Group not found: " + id);
        }
        return GroupMapper.toDTO(group, owner);
    }

    @Transactional
    public GroupDTO update(UUID id, UpdateGroupRequest request, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        requireWritable(group);
        group.setName(request.getName().trim());
        group.setDescription(request.getDescription());
        touch(group);
        return GroupMapper.toDTO(group, true);
    }

    @Transactional
    public GroupDTO join(String joinCode, String email) {
        User student = requireUser(email);
        if (student.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only students can join groups");
        }
        ClassGroup group = groupRepository.findByJoinCodeIgnoreCase(joinCode.trim())
                .orElseThrow(() -> new EntityNotFoundException("No active group uses that join code"));
        requireWritable(group);
        GroupEnrollment enrollment = enrollmentRepository.findByGroupIdAndStudentId(group.getId(), student.getId())
                .map(existing -> {
                    if (existing.getStatus() == EnrollmentStatus.ACTIVE) {
                        throw new ValidationException("Student is already enrolled in this group");
                    }
                    return existing;
                })
                .orElseGet(() -> new GroupEnrollment(group, student));
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        enrollment.setJoinedAt(LocalDateTime.now());
        enrollment.setEndedAt(null);
        enrollmentRepository.save(enrollment);
        return GroupMapper.toDTO(group, false);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDTO> listStudents(UUID id, String email) {
        requireOwnedGroup(id, email);
        return enrollmentRepository.findByGroupIdAndStatusOrderByJoinedAtAsc(id, EnrollmentStatus.ACTIVE)
                .stream().map(GroupMapper::toDTO).toList();
    }

    @Transactional
    public void removeStudent(UUID id, UUID studentId, String email) {
        requireOwnedGroup(id, email);
        GroupEnrollment enrollment = enrollmentRepository.findByGroupIdAndStudentId(id, studentId)
                .filter(item -> item.getStatus() == EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new EntityNotFoundException("Active enrollment not found"));
        enrollment.setStatus(EnrollmentStatus.REMOVED);
        enrollment.setEndedAt(LocalDateTime.now());
    }

    @Transactional
    public void leave(UUID id, String email) {
        User student = requireUser(email);
        GroupEnrollment enrollment = enrollmentRepository.findByGroupIdAndStudentId(id, student.getId())
                .filter(item -> item.getStatus() == EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new EntityNotFoundException("Active enrollment not found"));
        enrollment.setStatus(EnrollmentStatus.LEFT);
        enrollment.setEndedAt(LocalDateTime.now());
    }

    @Transactional
    public GroupDTO setArchived(UUID id, boolean archived, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        if (!Boolean.TRUE.equals(group.getIsActive())) throw new ValidationException("Deleted groups cannot be changed");
        group.setArchived(archived);
        touch(group);
        return GroupMapper.toDTO(group, true);
    }

    @Transactional
    public void softDelete(UUID id, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        group.setIsActive(false);
        group.setArchived(true);
        touch(group);
    }

    @Transactional
    public GroupDTO restore(UUID id, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        group.setIsActive(true);
        group.setArchived(true);
        touch(group);
        return GroupMapper.toDTO(group, true);
    }

    @Transactional
    public GroupDTO rotateJoinCode(UUID id, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        requireWritable(group);
        group.setJoinCode(generateJoinCode());
        touch(group);
        return GroupMapper.toDTO(group, true);
    }

    public ClassGroup requireOwnedWritableGroup(UUID id, User owner) {
        ClassGroup group = requireGroup(id);
        if (!group.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Only the group owner can perform this action");
        }
        requireWritable(group);
        return group;
    }

    public ClassGroup getGroupForAssignmentAccess(UUID id, User user) {
        ClassGroup group = requireGroup(id);
        if (group.getOwner().getId().equals(user.getId())) return group;
        boolean enrolled = user.getRole() == Role.STUDENT
                && enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                        id, user.getId(), EnrollmentStatus.ACTIVE);
        if (!enrolled || !Boolean.TRUE.equals(group.getIsActive())) {
            throw new AccessDeniedException("You cannot access assignments in this group");
        }
        return group;
    }

    private ClassGroup requireOwnedGroup(UUID id, String email) {
        User owner = requireUser(email);
        ClassGroup group = requireGroup(id);
        if (!group.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Only the group owner can perform this action");
        }
        return group;
    }

    private ClassGroup requireGroup(UUID id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + id));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private void requireWritable(ClassGroup group) {
        if (!Boolean.TRUE.equals(group.getIsActive())) throw new ValidationException("Group is deleted");
        if (Boolean.TRUE.equals(group.getArchived())) throw new ValidationException("Group is archived and read-only");
    }

    private void touch(ClassGroup group) { group.setUpdatedAt(LocalDateTime.now()); }

    private String generateJoinCode() {
        String code;
        do {
            StringBuilder result = new StringBuilder(JOIN_CODE_LENGTH);
            for (int i = 0; i < JOIN_CODE_LENGTH; i++) {
                result.append(JOIN_CODE_ALPHABET.charAt(secureRandom.nextInt(JOIN_CODE_ALPHABET.length())));
            }
            code = result.toString();
        } while (groupRepository.existsByJoinCodeIgnoreCase(code));
        return code;
    }
}
