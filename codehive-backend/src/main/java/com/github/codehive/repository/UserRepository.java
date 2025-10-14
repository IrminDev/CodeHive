package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    Optional<User> findByEnrollmentNumber(String enrollmentNumber);
    
    List<User> findAllByIsActive(Boolean isActive);
}
