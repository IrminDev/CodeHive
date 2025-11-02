package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.github.codehive.model.entity.PasswordResetToken;
import com.github.codehive.model.entity.User;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    
    List<PasswordResetToken> findByUserAndUsedFalse(User user);
}
