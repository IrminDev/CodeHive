package com.github.codehive.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEmailException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEnrollmentNumberException;
import com.github.codehive.model.mapper.UserMapper;
import com.github.codehive.model.request.admin.UpdateScopesRequest;
import com.github.codehive.model.request.admin.UpdateUserRequest;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.EnrollmentNumberRules;

@Service
public class AdminUserService {
    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> list(Role role, Boolean active, int page, int size) {
        Specification<User> specification = Specification.allOf();
        if (role != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("role"), role));
        if (active != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("isActive"), active));
        return userRepository.findAll(specification,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).map(UserMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public UserDTO get(UUID id) {
        return UserMapper.toDTO(requireUser(id));
    }

    @Transactional
    public UserDTO update(UUID id, UpdateUserRequest request, String requesterEmail) {
        User requester = requireRequester(requesterEmail);
        User target = requireUser(id);
        requireMutationPermission(requester, target, Scope.UPDATE_USERS, Scope.UPDATE_ADMINS);
        EnrollmentNumberRules.validate(target.getRole(), request.getEnrollmentNumber());

        userRepository.findByEmail(request.getEmail()).filter(user -> !user.getId().equals(id))
                .ifPresent(user -> { throw new AlreadyRegisteredEmailException("Email is already registered"); });
        userRepository.findByEnrollmentNumber(request.getEnrollmentNumber()).filter(user -> !user.getId().equals(id))
                .ifPresent(user -> { throw new AlreadyRegisteredEnrollmentNumberException("Enrollment number is already registered"); });

        target.setName(request.getName().trim());
        target.setLastName(request.getLastName().trim());
        target.setEmail(request.getEmail().trim());
        target.setEnrollmentNumber(request.getEnrollmentNumber().trim());
        return UserMapper.toDTO(target);
    }

    @Transactional
    public void setActive(UUID id, boolean active, String requesterEmail) {
        User requester = requireRequester(requesterEmail);
        User target = requireUser(id);
        requireMutationPermission(requester, target, Scope.MANAGE_USER_STATUS, Scope.MANAGE_ADMIN_STATUS);
        if (!active && Boolean.TRUE.equals(target.getIsActive()) && target.hasScope(Scope.SUPER_ADMIN)) {
            requireAnotherActiveSuperAdmin();
        }
        target.setIsActive(active);
    }

    @Transactional
    public UserDTO updateScopes(UUID id, UpdateScopesRequest request, String requesterEmail) {
        User requester = requireRequester(requesterEmail);
        User target = requireUser(id);
        requireMutationPermission(requester, target, Scope.MANAGE_SCOPES, Scope.MANAGE_SCOPES);

        Set<Scope> overlap = new HashSet<>(request.getGrant());
        overlap.retainAll(request.getRevoke());
        if (!overlap.isEmpty()) throw new ValidationException("A scope cannot be granted and revoked together");

        boolean superAdmin = requester.hasScope(Scope.SUPER_ADMIN);
        Set<Scope> changed = new HashSet<>(request.getGrant());
        changed.addAll(request.getRevoke());
        if (!superAdmin) {
            if (changed.contains(Scope.SUPER_ADMIN) || !requester.getScopes().containsAll(changed)) {
                throw new AccessDeniedException("Administrators may only delegate scopes they explicitly hold");
            }
        }
        if (target.getRole() != Role.ADMIN && changed.stream().anyMatch(this::isAdminOnly)) {
            throw new ValidationException("Administrative scopes can only be assigned to admins");
        }
        if (request.getRevoke().contains(Scope.SUPER_ADMIN) && target.hasScope(Scope.SUPER_ADMIN)
                && Boolean.TRUE.equals(target.getIsActive())) {
            requireAnotherActiveSuperAdmin();
        }

        Set<Scope> scopes = new HashSet<>(target.getScopes());
        scopes.addAll(request.getGrant());
        scopes.removeAll(request.getRevoke());
        target.setScopes(new ArrayList<>(scopes));
        return UserMapper.toDTO(target);
    }

    private boolean isAdminOnly(Scope scope) {
        return scope != Scope.CREATE_GROUP;
    }

    private void requireMutationPermission(User requester, User target, Scope userScope, Scope adminScope) {
        if (requester.getRole() != Role.ADMIN) throw new AccessDeniedException("Admin role required");
        if (requester.getId().equals(target.getId())) {
            throw new AccessDeniedException("Administrators cannot manage themselves");
        }
        boolean requesterIsSuper = requester.hasScope(Scope.SUPER_ADMIN);
        if (target.hasScope(Scope.SUPER_ADMIN) && !requesterIsSuper) {
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

    private void requireAnotherActiveSuperAdmin() {
        if (userRepository.countByRoleAndIsActiveTrueAndScopesContaining(Role.ADMIN, Scope.SUPER_ADMIN) <= 1) {
            throw new ValidationException("At least one active superadmin must remain");
        }
    }

    private User requireRequester(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private User requireUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }
}
