package com.github.codehive.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.PasswordResetToken;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.PasswordResetTokenRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class RecoveryPasswordService {
    private final MailSenderService mailSenderService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder ;

    public RecoveryPasswordService(MailSenderService mailSenderService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.mailSenderService = mailSenderService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void sendPasswordResetEmail(String email) {
        // Find the user by email or throw if not found
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));

        // Check if user is active
        if (!user.getIsActive()) {
            throw new EntityNotFoundException("User account is inactive");
        }

        // Invalidate all previous unused tokens for this user
        passwordResetTokenRepository.findByUserAndUsedFalse(user).forEach(oldToken -> {
            oldToken.setUsed(true);
            passwordResetTokenRepository.save(oldToken);
        });

        // Generate a random token and persist it
        String token = UUID.randomUUID().toString();
        PasswordResetToken passwordResetToken = new PasswordResetToken(token, LocalDateTime.now().plusMinutes(15), user);
        passwordResetTokenRepository.save(passwordResetToken);

        // Send the password reset email containing the token
        mailSenderService.sendPasswordResetEmail(email, token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Find the token or throw if not found
        PasswordResetToken passwordResetToken = passwordResetTokenRepository
                .findByToken(token)
                .orElseThrow(() -> new com.github.codehive.model.exception.recovery.TokenNotFoundException(
                        "Invalid password reset token"));

        // Check if token is expired
        if (passwordResetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new com.github.codehive.model.exception.recovery.ExpiredRecoveryTokenException(
                    "Password reset token has expired");
        }

        // Check if token has already been used
        if (passwordResetToken.getUsed()) {
            throw new com.github.codehive.model.exception.recovery.TokenAlreadyUsedException(
                    "This password reset token has already been used");
        }

        // Update user password
        User user = passwordResetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        passwordResetToken.setUsed(true);
        passwordResetTokenRepository.save(passwordResetToken);
    }
}
