package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    @EntityGraph(attributePaths = "scopes")
    Optional<User> findByEmail(String email);
    
    Optional<User> findByEnrollmentNumber(String enrollmentNumber);
    
    List<User> findAllByIsActive(Boolean isActive);
    List<User> findAllByRole(Role role);
    long countByRoleAndIsActiveTrueAndScopesContaining(Role role, com.github.codehive.model.enums.Scope scope);
}
