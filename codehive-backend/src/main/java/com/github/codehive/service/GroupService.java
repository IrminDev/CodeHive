package com.github.codehive.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
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
import com.github.codehive.model.enums.GroupDeletionReason;
import com.github.codehive.model.enums.GroupRelationship;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.mapper.GroupMapper;
import com.github.codehive.model.request.group.CreateGroupRequest;
import com.github.codehive.model.request.group.UpdateGroupRequest;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.model.enums.NotificationType;

@Service
public class GroupService {
    private static final String JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int JOIN_CODE_LENGTH = 8;
    private final SecureRandom secureRandom = new SecureRandom();

    private final ClassGroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final NotificationDomainEventPublisher notificationPublisher;

    public GroupService(ClassGroupRepository groupRepository, GroupEnrollmentRepository enrollmentRepository,
                        UserRepository userRepository,
                        NotificationDomainEventPublisher notificationPublisher) {
        this.groupRepository = groupRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.notificationPublisher = notificationPublisher;
    }

    @Transactional
    public GroupDTO create(CreateGroupRequest request, String email) {
        User owner = requireUserForUpdate(email);
        requireManager(owner);
        ClassGroup group = groupRepository.save(new ClassGroup(
                request.getName().trim(), request.getDescription(), owner, generateJoinCode()));
        return GroupMapper.toDTO(group, true);
    }

    @Transactional(readOnly = true)
    public List<GroupDTO> listMine(String email, boolean includeDeleted) {
        return listMine(email, includeDeleted, GroupRelationship.ACCESSIBLE);
    }

    @Transactional(readOnly = true)
    public List<GroupDTO> listMine(String email, boolean includeDeleted, GroupRelationship relationship) {
        User user = requireUser(email);
        Map<UUID, GroupDTO> groups = new LinkedHashMap<>();
        if (relationship != GroupRelationship.ENROLLED) {
            if (relationship == GroupRelationship.OWNED) requireManager(user);
            if (user.canManageGroups()) {
                List<ClassGroup> owned = includeDeleted
                        ? groupRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId())
                        : groupRepository.findByOwnerIdAndIsActiveTrueOrderByCreatedAtDesc(user.getId());
                owned.stream().filter(group -> !isTerminallyDeleted(group))
                        .forEach(group -> groups.put(group.getId(), GroupMapper.toDTO(group, true)));
            }
        }
        if (relationship != GroupRelationship.OWNED && user.getRole() == Role.STUDENT) {
            enrollmentRepository.findByStudentIdAndStatus(user.getId(), EnrollmentStatus.ACTIVE).stream()
                    .map(GroupEnrollment::getGroup)
                    .filter(group -> Boolean.TRUE.equals(group.getIsActive()))
                    .forEach(group -> groups.putIfAbsent(group.getId(), GroupMapper.toDTO(group, false)));
        } else if (relationship == GroupRelationship.ENROLLED) {
            throw new AccessDeniedException("Only students can list enrolled groups");
        }
        return groups.values().stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupDTO get(UUID id, String email) {
        User user = requireUser(email);
        ClassGroup group = requireGroup(id);
        boolean owner = group.getOwner().getId().equals(user.getId());
        boolean enrolled = enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                id, user.getId(), EnrollmentStatus.ACTIVE);
        if (owner) {
            requireManager(user);
            if (isTerminallyDeleted(group)) throw new EntityNotFoundException("Group not found: " + id);
        } else if (!enrolled) {
            throw new AccessDeniedException("You cannot access this group");
        }
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
        User student = requireUserForUpdate(email);
        if (student.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only students can join groups");
        }
        ClassGroup group = groupRepository.findByJoinCodeIgnoreCase(joinCode.trim())
                .filter(candidate -> Boolean.TRUE.equals(candidate.getIsActive()))
                .orElseThrow(() -> new EntityNotFoundException("No active group uses that join code"));
        if (group.getOwner().getId().equals(student.getId())) {
            throw new ValidationException("Group owners cannot enroll in their own group");
        }
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
        GroupEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
        if (savedEnrollment != null) enrollment = savedEnrollment;
        notificationPublisher.publish(NotificationDomainEvent.of(
                NotificationType.STUDENT_ENROLLED, student.getId(), student.getId(),
                group.getId(), null, null, enrollment.getId()));
        return GroupMapper.toDTO(group, false);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDTO> listStudents(UUID id, String email) {
        requireStudentListAccess(id, email);
        return enrollmentRepository.findByGroupIdAndStatusOrderByJoinedAtAsc(id, EnrollmentStatus.ACTIVE)
                .stream().filter(enrollment -> enrollment.getStudent().canParticipate())
                .map(GroupMapper::toDTO).toList();
    }

    @Transactional
    public void removeStudent(UUID id, UUID studentId, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        GroupEnrollment enrollment = enrollmentRepository.findByGroupIdAndStudentId(id, studentId)
                .filter(item -> item.getStatus() == EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new EntityNotFoundException("Active enrollment not found"));
        enrollment.setStatus(EnrollmentStatus.REMOVED);
        enrollment.setEndedAt(LocalDateTime.now());
        notificationPublisher.publish(NotificationDomainEvent.of(
                NotificationType.REMOVED_FROM_GROUP, group.getOwner().getId(), studentId,
                group.getId(), null, null, enrollment.getId()));
    }

    @Transactional
    public void leave(UUID id, String email) {
        User student = requireUser(email);
        GroupEnrollment enrollment = enrollmentRepository.findByGroupIdAndStudentId(id, student.getId())
                .filter(item -> item.getStatus() == EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new EntityNotFoundException("Active enrollment not found"));
        enrollment.setStatus(EnrollmentStatus.LEFT);
        enrollment.setEndedAt(LocalDateTime.now());
        notificationPublisher.publish(NotificationDomainEvent.of(
                NotificationType.STUDENT_LEFT, student.getId(), student.getId(),
                id, null, null, enrollment.getId()));
    }

    @Transactional
    public GroupDTO setArchived(UUID id, boolean archived, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        if (!Boolean.TRUE.equals(group.getIsActive())) throw new ValidationException("Deleted groups cannot be changed");
        group.setArchived(archived);
        touch(group);
        if (archived) {
            notificationPublisher.publish(NotificationDomainEvent.of(
                    NotificationType.GROUP_ARCHIVED, group.getOwner().getId(), null,
                    group.getId(), null, null));
        }
        return GroupMapper.toDTO(group, true);
    }

    @Transactional
    public void softDelete(UUID id, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        group.setIsActive(false);
        group.setArchived(true);
        if (group.getDeletedAt() == null) group.setDeletedAt(java.time.Instant.now());
        group.setDeletionReason(GroupDeletionReason.OWNER_REQUEST);
        touch(group);
        notificationPublisher.publish(NotificationDomainEvent.of(
                NotificationType.GROUP_ARCHIVED, group.getOwner().getId(), null,
                group.getId(), null, null));
    }

    @Transactional
    public GroupDTO restore(UUID id, String email) {
        ClassGroup group = requireOwnedGroup(id, email);
        if (Boolean.TRUE.equals(group.getIsActive())) {
            throw new ValidationException("Group is not deleted");
        }
        if (group.getDeletionReason() != null && group.getDeletionReason().isTerminal()) {
            throw new ValidationException("This group was deleted by an account lifecycle change and cannot be restored");
        }
        group.setIsActive(true);
        group.setArchived(true);
        group.setDeletedAt(null);
        group.setDeletionReason(null);
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
        User lockedOwner = requireUserForUpdate(owner.getEmail());
        requireManager(lockedOwner);
        ClassGroup group = requireGroup(id);
        if (!group.getOwner().getId().equals(lockedOwner.getId())) {
            throw new AccessDeniedException("Only the group owner can perform this action");
        }
        requireWritable(group);
        return group;
    }

    public ClassGroup getGroupForAssignmentAccess(UUID id, User user) {
        ClassGroup group = requireGroup(id);
        if (group.getOwner().getId().equals(user.getId())) {
            requireManager(user);
            if (isTerminallyDeleted(group)) throw new EntityNotFoundException("Group not found: " + id);
            return group;
        }
        boolean enrolled = user.getRole() == Role.STUDENT
                && enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                        id, user.getId(), EnrollmentStatus.ACTIVE);
        if (!enrolled || !Boolean.TRUE.equals(group.getIsActive())) {
            throw new AccessDeniedException("You cannot access assignments in this group");
        }
        return group;
    }

    private ClassGroup requireOwnedGroup(UUID id, String email) {
        User owner = requireUserForUpdate(email);
        requireManager(owner);
        ClassGroup group = requireGroup(id);
        if (!group.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Only the group owner can perform this action");
        }
        if (isTerminallyDeleted(group)) throw new EntityNotFoundException("Group not found: " + id);
        return group;
    }

    private void requireStudentListAccess(UUID id, String email) {
        User user = requireUser(email);
        ClassGroup group = requireGroup(id);
        if (group.getOwner().getId().equals(user.getId())) {
            requireManager(user);
            if (isTerminallyDeleted(group)) throw new EntityNotFoundException("Group not found: " + id);
            return;
        }

        boolean activelyEnrolled = user.getRole() == Role.STUDENT
                && enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                        id, user.getId(), EnrollmentStatus.ACTIVE);
        if (!activelyEnrolled) {
            throw new AccessDeniedException("You cannot view students in this group");
        }
        if (!Boolean.TRUE.equals(group.getIsActive())) {
            throw new EntityNotFoundException("Group not found: " + id);
        }
    }

    private ClassGroup requireGroup(UUID id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + id));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private User requireUserForUpdate(String email) {
        return userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private void requireWritable(ClassGroup group) {
        if (!Boolean.TRUE.equals(group.getIsActive())) throw new ValidationException("Group is deleted");
        if (Boolean.TRUE.equals(group.getArchived())) throw new ValidationException("Group is archived and read-only");
    }

    private void requireManager(User user) {
        if (!user.canManageGroups()) {
            throw new AccessDeniedException("CREATE_GROUP is required to manage groups");
        }
    }

    private boolean isTerminallyDeleted(ClassGroup group) {
        return group.getDeletionReason() != null && group.getDeletionReason().isTerminal();
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
