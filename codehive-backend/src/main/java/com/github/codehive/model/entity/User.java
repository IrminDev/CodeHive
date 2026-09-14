package com.github.codehive.model.entity;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import org.hibernate.annotations.ColumnDefault;

import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_admin_status_role", columnList = "is_active,blocked,role")
})
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 80)
    private String lastName;

    @Column(nullable = false, unique = true, length = 50)
    private String enrollmentNumber;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean isActive;

    @Column(nullable = false)
    private Boolean temporaryPassword;

    // Bumped on every password change so previously issued JWTs stop authenticating.
    @Column(nullable = false)
    @ColumnDefault("0")
    private int tokenVersion = 0;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean blocked;

    private Instant blockedAt;

    private Instant deletedAt;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private Long rateLimitViolationCount;

    private Instant lastRateLimitViolationAt;

    @ElementCollection(targetClass = Scope.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_scopes", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "scope", nullable = false, length = 50)
    private List<Scope> scopes = new ArrayList<>();

    public User() {
        this.createdAt = LocalDateTime.now();
        this.scopes = new ArrayList<>();
        this.isActive = true;
        this.temporaryPassword = false;
        this.blocked = false;
        this.rateLimitViolationCount = 0L;
    }

    public User(String name, String lastName, String enrollmentNumber, String email, String password, Role role) {
        this.name = name;
        this.lastName = lastName;
        this.enrollmentNumber = enrollmentNumber;
        this.email = email;
        this.password = password;
        this.role = role;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
        this.temporaryPassword = false;
        this.blocked = false;
        this.rateLimitViolationCount = 0L;
        this.scopes = new ArrayList<>();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEnrollmentNumber() {
        return enrollmentNumber;
    }

    public void setEnrollmentNumber(String enrollmentNumber) {
        this.enrollmentNumber = enrollmentNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getTemporaryPassword() {
        return temporaryPassword;
    }

    public void setTemporaryPassword(Boolean temporaryPassword) {
        this.temporaryPassword = temporaryPassword;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    public void setTokenVersion(int tokenVersion) {
        this.tokenVersion = tokenVersion;
    }

    public Boolean getBlocked() { return blocked; }
    public void setBlocked(Boolean blocked) { this.blocked = blocked; }
    public Instant getBlockedAt() { return blockedAt; }
    public void setBlockedAt(Instant blockedAt) { this.blockedAt = blockedAt; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
    public Long getRateLimitViolationCount() { return rateLimitViolationCount; }
    public void setRateLimitViolationCount(Long rateLimitViolationCount) { this.rateLimitViolationCount = rateLimitViolationCount; }
    public Instant getLastRateLimitViolationAt() { return lastRateLimitViolationAt; }
    public void setLastRateLimitViolationAt(Instant lastRateLimitViolationAt) { this.lastRateLimitViolationAt = lastRateLimitViolationAt; }

    public boolean isApplicationVisible() {
        return Boolean.TRUE.equals(isActive);
    }

    public boolean canParticipate() {
        return isApplicationVisible() && !Boolean.TRUE.equals(blocked);
    }

    public List<Scope> getScopes() {
        return scopes;
    }

    public void setScopes(List<Scope> scopes) {
        this.scopes = scopes;
    }

    public void addScope(Scope scope) {
        if (scope == null)
            return;
        if (this.scopes == null)
            this.scopes = new ArrayList<>();
        if (!this.scopes.contains(scope)) {
            this.scopes.add(scope);
        }
    }

    public boolean hasScope(Scope scope) {
        return scopes != null && scopes.contains(scope);
    }

    public boolean canManageGroups() {
        return canParticipate()
                && (role == Role.STUDENT || role == Role.TEACHER)
                && hasScope(Scope.CREATE_GROUP);
    }

    @PrePersist
    void applyDefaultScopes() {
        if (role == Role.TEACHER) {
            addScope(Scope.CREATE_GROUP);
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<Scope> effectiveScopes = new LinkedHashSet<>();
        if (scopes != null) effectiveScopes.addAll(scopes);
        if (effectiveScopes.contains(Scope.SUPER_ADMIN)) {
            effectiveScopes.addAll(List.of(Scope.values()));
        }
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(role.name()));
        effectiveScopes.stream()
                .map(Scope::name)
                .map(SimpleGrantedAuthority::new)
                .forEach(authorities::add);
        return authorities;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !Boolean.TRUE.equals(blocked);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(isActive);
    }
}
