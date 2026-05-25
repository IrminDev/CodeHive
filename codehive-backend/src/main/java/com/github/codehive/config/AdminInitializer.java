package com.github.codehive.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.repository.UserRepository;

@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@codehive.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@12345}")
    private String adminPassword;

    @Value("${app.admin.name:Super}")
    private String adminName;

    @Value("${app.admin.lastName:Admin}")
    private String adminLastName;

    @Value("${app.admin.enrollmentNumber:ADMIN-001}")
    private String adminEnrollmentNumber;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            logger.info("Super admin already exists: {}", adminEmail);
            return;
        }

        User admin = new User(adminName, adminLastName, adminEnrollmentNumber, adminEmail,
                passwordEncoder.encode(adminPassword), Role.ADMIN);
        admin.addScope(Scope.SUPER_ADMIN);
        admin.addScope(Scope.MANAGE_USERS);
        admin.addScope(Scope.MANAGE_GROUPS);
        admin.addScope(Scope.CHECK_ANALYTICS);
        admin.addScope(Scope.CREATE_GROUP);

        userRepository.save(admin);
        logger.info("Default super admin created: {}", adminEmail);
    }
}
