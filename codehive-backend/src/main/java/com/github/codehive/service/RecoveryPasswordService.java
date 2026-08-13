package com.github.codehive.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.PasswordResetToken;
import com.github.codehive.model.entity.User;
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

    /**
     * Send password reset email using identifier (email or enrollment number)
     * @param identifier the email or enrollment number
     * @return true if the identifier was an enrollment number, false if it was an email
     */
    @Transactional
    public boolean sendPasswordResetEmail(String identifier) {
        boolean isEnrollmentNumber = !AuthService.isEmail(identifier);
        
        // Find the user by email or enrollment number - DO NOT throw exception if not found
        User user;
        if (isEnrollmentNumber) {
            user = userRepository.findByEnrollmentNumber(identifier.trim()).orElse(null);
        } else {
            user = userRepository.findByEmail(identifier.trim()).orElse(null);
        }

        // If user exists and is active, send the email
        if (user != null && user.getIsActive()) {
            // Invalidate all previous unused tokens for this user
            passwordResetTokenRepository.findByUserAndUsedFalse(user).forEach(oldToken -> {
                oldToken.setUsed(true);
                passwordResetTokenRepository.save(oldToken);
            });

            // Generate a random token and persist it
            String token = UUID.randomUUID().toString();
            PasswordResetToken passwordResetToken = new PasswordResetToken(token, LocalDateTime.now().plusMinutes(15), user);
            passwordResetTokenRepository.save(passwordResetToken);

            // Send the password reset email containing the token to the user's email
            mailSenderService.sendPasswordResetEmail(user.getEmail(), token);
        }

        return isEnrollmentNumber;
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
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        // Mark token as used
        passwordResetToken.setUsed(true);
        passwordResetTokenRepository.save(passwordResetToken);
    }
}
