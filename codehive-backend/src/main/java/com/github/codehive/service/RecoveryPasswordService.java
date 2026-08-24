package com.github.codehive.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
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
        if (user != null && user.canParticipate()) {
            // Invalidate all previous unused tokens for this user
            passwordResetTokenRepository.findByUserAndUsedFalse(user).forEach(oldToken -> {
                oldToken.setUsed(true);
                passwordResetTokenRepository.save(oldToken);
            });

            // Generate a random token; persist only its hash so a DB leak can't be used to reset accounts.
            String rawToken = UUID.randomUUID().toString();
            PasswordResetToken passwordResetToken = new PasswordResetToken(
                    hashToken(rawToken), LocalDateTime.now().plusMinutes(15), user);
            passwordResetTokenRepository.save(passwordResetToken);

            // Send the raw token to the user's email; only the hash is stored server-side.
            mailSenderService.sendPasswordResetEmail(user.getEmail(), rawToken);
        }

        return isEnrollmentNumber;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Find the token by its hash or throw if not found
        PasswordResetToken passwordResetToken = passwordResetTokenRepository
                .findByToken(hashToken(token))
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
        if (!user.canParticipate()) {
            throw new com.github.codehive.model.exception.recovery.InvalidRecoveryTokenException(
                    "Invalid password reset token");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        // Mark token as used
        passwordResetToken.setUsed(true);
        passwordResetTokenRepository.save(passwordResetToken);
    }

    private static String hashToken(String token) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
