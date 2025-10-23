package com.github.codehive.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.github.codehive.model.entity.PasswordResetToken;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.recovery.ExpiredRecoveryTokenException;
import com.github.codehive.model.exception.recovery.InvalidRecoveryTokenException;
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

    public void sendPasswordResetEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));

        String token = UUID.randomUUID().toString();
        PasswordResetToken passwordResetToken = new PasswordResetToken(token, LocalDateTime.now().plusMinutes(15), user);
        passwordResetTokenRepository.save(passwordResetToken);

        mailSenderService.sendPasswordResetEmail(email, token);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidRecoveryTokenException("Invalid password reset token."));

        if (passwordResetToken.getExpiryDate().isBefore(LocalDateTime.now()) || passwordResetToken.getUsed()) {
            throw new ExpiredRecoveryTokenException("The password reset token is expired or has already been used.");
        }

        User user = passwordResetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetToken.setUsed(true);
        passwordResetTokenRepository.save(passwordResetToken);
    }
}
