package com.github.codehive.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.admin.AdminUserDetailDTO;
import com.github.codehive.model.dto.admin.AdminUserSummaryDTO;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AdminAuditAction;
import com.github.codehive.model.enums.AdminUserStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.GroupDeletionReason;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.RoleTransitionConflictException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEmailException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEnrollmentNumberException;
import com.github.codehive.model.request.admin.UpdateScopesRequest;
import com.github.codehive.model.request.admin.UpdateUserRequest;
import com.github.codehive.model.request.admin.UpdateUserRoleRequest;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.PasswordResetTokenRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.EnrollmentNumberRules;

@Service
public class AdminUserService {
    private static final Set<String> SAFE_SORTS = Set.of(
            "createdAt", "name", "lastName", "email", "enrollmentNumber", "role", "blocked");

    private final UserRepository userRepository;
    private final ClassGroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificationDomainEventPublisher notificationPublisher;
    private final AdminAuditService auditService;

    public AdminUserService(UserRepository userRepository,
                            ClassGroupRepository groupRepository,
                            GroupEnrollmentRepository enrollmentRepository,
                            AssignmentRepository assignmentRepository,
                            StudentAssignmentWorkRepository workRepository,
                            SubmissionRepository submissionRepository,
                            ExecutionRepository executionRepository,
                            PasswordResetTokenRepository passwordResetTokenRepository,
                            NotificationDomainEventPublisher notificationPublisher,
                            AdminAuditService auditService) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.workRepository = workRepository;
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.notificationPublisher = notificationPublisher;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserSummaryDTO> list(String search, Role role, AdminUserStatus status,
                                           int page, int size, String sort, Sort.Direction direction) {
        Specification<User> spec = (root, query, cb) -> cb.isTrue(root.get("isActive"));
        if (role != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), role));
        if (status == AdminUserStatus.BLOCKED) {
            spec = spec.and((root, query, cb) -> cb.isTrue(root.get("blocked")));
        } else if (status == AdminUserStatus.ACTIVE) {
            spec = spec.and((root, query, cb) -> cb.isFalse(root.get("blocked")));
        } else if (status == AdminUserStatus.DELETED) {
            spec = spec.and((root, query, cb) -> cb.disjunction());
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("enrollmentNumber")), pattern)));
        }
        String sortProperty = SAFE_SORTS.contains(sort) ? sort : "createdAt";
        return userRepository.findAll(spec, PageRequest.of(page, size, Sort.by(direction, sortProperty)))
                .map(this::summary);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailDTO get(UUID id) {
        return detail(requireVisibleUser(id));
    }

    @Transactional
    public AdminUserDetailDTO update(UUID id, UpdateUserRequest request, String requesterEmail) {
        User requester = requireRequester(requesterEmail);
        User target = requireMutableUser(id);
        requireMutationPermission(requester, target, Scope.UPDATE_USERS, Scope.UPDATE_ADMINS);
        EnrollmentNumberRules.validate(target.getRole(), request.getEnrollmentNumber());
        requireUniqueIdentity(id, request.getEmail(), request.getEnrollmentNumber());

        target.setName(request.getName().trim());
        target.setLastName(request.getLastName().trim());
        target.setEmail(request.getEmail().trim().toLowerCase(Locale.ROOT));
        target.setEnrollmentNumber(request.getEnrollmentNumber().trim());
        auditService.success(requester, target, AdminAuditAction.USER_PROFILE_UPDATED,
                request.getReason(), "Profile fields updated");
        return detail(target);
    }

    @Transactional
    public AdminUserDetailDTO updateRole(UUID id, UpdateUserRoleRequest request, String requesterEmail) {
        User requester = requireRequester(requesterEmail);
        User target = requireMutableUser(id);
        requireRoleMutationPermission(requester, target, request.role());
        EnrollmentNumberRules.validate(request.role(), request.enrollmentNumber());
        requireUniqueEnrollment(id, request.enrollmentNumber());
        if (target.getRole() == request.role()) return detail(target);

        long activeEnrollments = target.getRole() == Role.STUDENT && request.role() != Role.STUDENT
                ? enrollmentRepository.countByStudentIdAndStatus(target.getId(), EnrollmentStatus.ACTIVE)
                : 0;
        long ownedGroups = request.role() == Role.ADMIN ? groupRepository.countByOwnerId(target.getId()) : 0;
        if (activeEnrollments > 0 && !request.confirmEnrollmentCancellation()) {
            throw new ValidationException("Role change requires confirmation to cancel "
                    + activeEnrollments + " active enrollment(s)");
        }
        if (ownedGroups > 0 && !request.confirmOwnedGroupDeletion()) {
            throw new ValidationException("Role change requires confirmation to delete "
                    + ownedGroups + " owned group(s)");
        }

        List<String> blockers = roleTransitionBlockers(target, request.role());
        if (!blockers.isEmpty()) {
            throw new RoleTransitionConflictException(blockers);
        }

        Role previous = target.getRole();
        if (activeEnrollments > 0) cancelActiveEnrollments(target);
        if (request.role() == Role.ADMIN) {
            terminalDeleteOwnedGroups(target, GroupDeletionReason.ROLE_CHANGED_TO_ADMIN);
        }
        target.setRole(request.role());
        target.setEnrollmentNumber(request.enrollmentNumber().trim());
        if (request.role() == Role.TEACHER) {
            Set<Scope> scopes = new HashSet<>(target.getScopes());
            scopes.add(Scope.CREATE_GROUP);
            target.setScopes(new ArrayList<>(scopes));
        } else if (request.role() == Role.ADMIN) {
            Set<Scope> scopes = new HashSet<>(target.getScopes());
            scopes.remove(Scope.CREATE_GROUP);
            target.setScopes(new ArrayList<>(scopes));
        }
        auditService.success(requester, target, AdminAuditAction.USER_ROLE_CHANGED,
                request.reason(), previous + " -> " + request.role());
        return detail(target);
    }

    @Transactional
    public AdminUserDetailDTO setStatus(UUID id, AdminUserStatus status, String reason,
                                         String requesterEmail) {
        User requester = requireRequester(requesterEmail);
        User target = requireMutableUser(id);
        requireMutationPermission(requester, target, Scope.MANAGE_USER_STATUS, Scope.MANAGE_ADMIN_STATUS);
        return switch (status) {
            case ACTIVE -> unblock(requester, target, reason);
            case BLOCKED -> block(requester, target, reason);
            case DELETED -> delete(requester, target, reason);
        };
    }

    @Transactional
    public AdminUserDetailDTO updateScopes(UUID id, UpdateScopesRequest request, String requesterEmail) {
        User requester = requireRequester(requesterEmail);
        User target = requireMutableUser(id);
        requireMutationPermission(requester, target, Scope.MANAGE_SCOPES, Scope.MANAGE_SCOPES);

        Set<Scope> overlap = new HashSet<>(request.getGrant());
        overlap.retainAll(request.getRevoke());
        if (!overlap.isEmpty()) throw new ValidationException("A scope cannot be granted and revoked together");
        if (request.getGrant().contains(Scope.MANAGE_GROUPS)) {
            throw new ValidationException("MANAGE_GROUPS is reserved; admin group access is read-only");
        }
        if (target.getRole() == Role.ADMIN && request.getGrant().contains(Scope.CREATE_GROUP)) {
            throw new ValidationException("CREATE_GROUP cannot be assigned to administrators");
        }
        if (target.getRole() == Role.TEACHER && request.getRevoke().contains(Scope.CREATE_GROUP)) {
            throw new ValidationException("CREATE_GROUP is mandatory for teachers");
        }
        if (target.getRole() == Role.STUDENT && target.hasScope(Scope.CREATE_GROUP)
                && request.getRevoke().contains(Scope.CREATE_GROUP)) {
            long ownedGroups = groupRepository.countByOwnerId(target.getId());
            if (ownedGroups > 0 && !request.isConfirmOwnedGroupDeletion()) {
                throw new ValidationException("Scope revocation requires confirmation to delete "
                        + ownedGroups + " owned group(s)");
            }
            terminalDeleteOwnedGroups(target, GroupDeletionReason.SCOPE_REVOKED);
        }

        Set<Scope> changed = new HashSet<>(request.getGrant());
        changed.addAll(request.getRevoke());
        Set<Scope> delegatedAdminScopes = new HashSet<>(changed);
        delegatedAdminScopes.remove(Scope.CREATE_GROUP);
        if (!requester.hasScope(Scope.SUPER_ADMIN)
                && (changed.contains(Scope.SUPER_ADMIN)
                    || !requester.getScopes().containsAll(delegatedAdminScopes))) {
            throw new AccessDeniedException("Administrators may only delegate scopes they explicitly hold");
        }
        if (target.getRole() != Role.ADMIN && changed.stream().anyMatch(this::isAdminOnly)) {
            throw new ValidationException("Administrative scopes can only be assigned to admins");
        }
        if (request.getRevoke().contains(Scope.SUPER_ADMIN) && target.hasScope(Scope.SUPER_ADMIN)) {
            requireAnotherActiveSuperAdmin();
        }

        Set<Scope> scopes = new HashSet<>(target.getScopes());
        scopes.addAll(request.getGrant());
        scopes.removeAll(request.getRevoke());
        target.setScopes(new ArrayList<>(scopes));
        auditService.success(requester, target, AdminAuditAction.USER_SCOPES_CHANGED,
                request.getReason(), "grant=" + request.getGrant() + ", revoke=" + request.getRevoke());
        return detail(target);
    }

    private AdminUserDetailDTO block(User requester, User target, String reason) {
        if (Boolean.TRUE.equals(target.getBlocked())) throw new ValidationException("User is already blocked");
        if (target.hasScope(Scope.SUPER_ADMIN)) requireAnotherActiveSuperAdmin();
        target.setBlocked(true);
        target.setBlockedAt(Instant.now());
        archiveOwnedGroups(target);
        invalidatePasswordResetTokens(target);
        auditService.success(requester, target, AdminAuditAction.USER_BLOCKED, reason,
                "Account blocked and owned active groups archived");
        return detail(target);
    }

    private AdminUserDetailDTO unblock(User requester, User target, String reason) {
        if (!Boolean.TRUE.equals(target.getBlocked())) throw new ValidationException("User is not blocked");
        target.setBlocked(false);
        target.setBlockedAt(null);
        auditService.success(requester, target, AdminAuditAction.USER_UNBLOCKED, reason,
                "Account unblocked; owned groups remain archived");
        return detail(target);
    }

    private AdminUserDetailDTO delete(User requester, User target, String reason) {
        if (target.hasScope(Scope.SUPER_ADMIN)) requireAnotherActiveSuperAdmin();
        if (target.getRole() == Role.STUDENT) cancelActiveEnrollments(target);
        terminalDeleteOwnedGroups(target, GroupDeletionReason.ACCOUNT_DELETED);
        invalidatePasswordResetTokens(target);
        auditService.success(requester, target, AdminAuditAction.USER_DELETED, reason,
                "Account soft-deleted and owned groups soft-deleted");
        target.setIsActive(false);
        target.setDeletedAt(Instant.now());
        target.setBlocked(false);
        target.setBlockedAt(null);
        return detail(target);
    }

    private void archiveOwnedGroups(User owner) {
        LocalDateTime updatedAt = LocalDateTime.now();
        for (ClassGroup group : groupRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())) {
            if (!Boolean.TRUE.equals(group.getIsActive())) continue;
            boolean notify = !Boolean.TRUE.equals(group.getArchived());
            group.setArchived(true);
            group.setUpdatedAt(updatedAt);
            if (notify) {
                notificationPublisher.publish(NotificationDomainEvent.of(
                        NotificationType.GROUP_ARCHIVED, owner.getId(), null, group.getId(), null, null));
            }
        }
    }

    private void terminalDeleteOwnedGroups(User owner, GroupDeletionReason reason) {
        Instant now = Instant.now();
        LocalDateTime updatedAt = LocalDateTime.now();
        for (ClassGroup group : groupRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())) {
            boolean notify = Boolean.TRUE.equals(group.getIsActive()) && !Boolean.TRUE.equals(group.getArchived());
            group.setArchived(true);
            group.setIsActive(false);
            if (group.getDeletedAt() == null) group.setDeletedAt(now);
            group.setDeletionReason(reason);
            group.setUpdatedAt(updatedAt);
            if (notify) {
                notificationPublisher.publish(NotificationDomainEvent.of(
                        NotificationType.GROUP_ARCHIVED, owner.getId(), null, group.getId(), null, null));
            }
        }
    }

    private void cancelActiveEnrollments(User student) {
        LocalDateTime endedAt = LocalDateTime.now();
        for (GroupEnrollment enrollment : enrollmentRepository.findByStudentIdAndStatus(
                student.getId(), EnrollmentStatus.ACTIVE)) {
            enrollment.setStatus(EnrollmentStatus.CANCELLED);
            enrollment.setEndedAt(endedAt);
            notificationPublisher.publish(NotificationDomainEvent.of(
                    NotificationType.STUDENT_ENROLLMENT_CANCELLED, student.getId(), student.getId(),
                    enrollment.getGroup().getId(), null, null, enrollment.getId()));
        }
    }

    private void invalidatePasswordResetTokens(User user) {
        passwordResetTokenRepository.findByUserAndUsedFalse(user)
                .forEach(token -> token.setUsed(true));
    }

    private List<String> roleTransitionBlockers(User target, Role requestedRole) {
        List<String> blockers = new ArrayList<>();
        if (target.getRole() == Role.ADMIN && requestedRole != Role.ADMIN) {
            List<Scope> adminScopes = target.getScopes().stream().filter(this::isAdminOnly).toList();
            if (!adminScopes.isEmpty()) blockers.add("Admin still has administrative scopes: " + adminScopes);
            if (target.hasScope(Scope.SUPER_ADMIN)
                    && activeSuperAdminCount() <= 1) {
                blockers.add("Role change would remove last active superadmin");
            }
        }
        return blockers.stream().distinct().toList();
    }

    private void requireRoleMutationPermission(User requester, User target, Role requestedRole) {
        if (requester.getId().equals(target.getId())) {
            throw new AccessDeniedException("Administrators cannot manage themselves");
        }
        if (target.hasScope(Scope.SUPER_ADMIN) && !requester.hasScope(Scope.SUPER_ADMIN)) {
            throw new AccessDeniedException("Only a superadmin can manage another superadmin");
        }
        Scope required;
        if (target.getRole() == Role.ADMIN) {
            required = Scope.UPDATE_ADMINS;
        } else if (requestedRole == Role.ADMIN) {
            required = Scope.CREATE_ADMINS;
        } else {
            required = Scope.UPDATE_USERS;
        }
        if (!hasEffectiveScope(requester, required)) {
            throw new AccessDeniedException("Missing scope: " + required.name());
        }
    }

    private void requireMutationPermission(User requester, User target, Scope userScope, Scope adminScope) {
        if (requester.getRole() != Role.ADMIN) throw new AccessDeniedException("Admin role required");
        if (requester.getId().equals(target.getId())) {
            throw new AccessDeniedException("Administrators cannot manage themselves");
        }
        if (target.hasScope(Scope.SUPER_ADMIN) && !requester.hasScope(Scope.SUPER_ADMIN)) {
            throw new AccessDeniedException("Only a superadmin can manage another superadmin");
        }
        Scope required = target.getRole() == Role.ADMIN ? adminScope : userScope;
        if (!hasEffectiveScope(requester, required)) {
            throw new AccessDeniedException("Missing scope: " + required.name());
        }
    }

    private boolean hasEffectiveScope(User user, Scope scope) {
        return user.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals(scope.name()));
    }

    private boolean isAdminOnly(Scope scope) {
        return scope != Scope.CREATE_GROUP;
    }

    private void requireAnotherActiveSuperAdmin() {
        if (activeSuperAdminCount() <= 1) {
            throw new ValidationException("At least one active, unblocked superadmin must remain");
        }
    }

    private long activeSuperAdminCount() {
        return userRepository.countByRoleAndIsActiveTrueAndBlockedFalseAndScopesContaining(
                Role.ADMIN, Scope.SUPER_ADMIN);
    }

    private void requireUniqueIdentity(UUID id, String email, String enrollmentNumber) {
        userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT)).filter(user -> !user.getId().equals(id))
                .ifPresent(user -> { throw new AlreadyRegisteredEmailException("Email is already registered"); });
        requireUniqueEnrollment(id, enrollmentNumber);
    }

    private void requireUniqueEnrollment(UUID id, String enrollmentNumber) {
        userRepository.findByEnrollmentNumber(enrollmentNumber.trim()).filter(user -> !user.getId().equals(id))
                .ifPresent(user -> { throw new AlreadyRegisteredEnrollmentNumberException(
                        "Enrollment number is already registered"); });
    }

    private User requireRequester(String email) {
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (!requester.canParticipate()) throw new AccessDeniedException("Account is unavailable");
        return requester;
    }

    private User requireVisibleUser(UUID id) {
        return userRepository.findById(id).filter(User::isApplicationVisible)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    private User requireMutableUser(UUID id) {
        return userRepository.findByIdForUpdate(id).filter(User::isApplicationVisible)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    private AdminUserSummaryDTO summary(User user) {
        AdminUserStatus status = !Boolean.TRUE.equals(user.getIsActive())
                ? AdminUserStatus.DELETED
                : Boolean.TRUE.equals(user.getBlocked()) ? AdminUserStatus.BLOCKED : AdminUserStatus.ACTIVE;
        return new AdminUserSummaryDTO(user.getId(), user.getEmail(), user.getName(), user.getLastName(),
                user.getEnrollmentNumber(), user.getRole(), List.copyOf(user.getScopes()), status,
                user.getCreatedAt(), user.getBlockedAt());
    }

    private AdminUserDetailDTO detail(User user) {
        UUID id = user.getId();
        return new AdminUserDetailDTO(summary(user), new AdminUserDetailDTO.ResourceCounts(
                groupRepository.countByOwnerId(id),
                groupRepository.countByOwnerIdAndIsActiveTrue(id),
                groupRepository.countByOwnerIdAndArchivedTrue(id),
                enrollmentRepository.countByStudentId(id),
                enrollmentRepository.countByStudentIdAndStatus(id, EnrollmentStatus.ACTIVE),
                assignmentRepository.countByAuthorId(id),
                assignmentRepository.countByAuthorIdAndIsActiveTrue(id),
                workRepository.countByStudentId(id),
                submissionRepository.countByStudentId(id),
                executionRepository.countByUserId(id)),
                user.getRateLimitViolationCount() == null ? 0 : user.getRateLimitViolationCount(),
                user.getLastRateLimitViolationAt());
    }
}
