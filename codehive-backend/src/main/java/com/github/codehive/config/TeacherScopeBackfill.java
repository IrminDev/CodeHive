package com.github.codehive.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.ApplicationDataMigration;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.repository.ApplicationDataMigrationRepository;
import com.github.codehive.repository.UserRepository;

@Component
@Order(100)
public class TeacherScopeBackfill implements CommandLineRunner {
    static final String MIGRATION_ID = "2026-07-teacher-create-group-scope";

    private final ApplicationDataMigrationRepository migrationRepository;
    private final UserRepository userRepository;

    public TeacherScopeBackfill(ApplicationDataMigrationRepository migrationRepository, UserRepository userRepository) {
        this.migrationRepository = migrationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (migrationRepository.existsById(MIGRATION_ID)) return;
        userRepository.findAllByRole(Role.TEACHER).forEach(user -> user.addScope(Scope.CREATE_GROUP));
        migrationRepository.save(new ApplicationDataMigration(MIGRATION_ID));
    }
}
