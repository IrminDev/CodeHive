package com.github.codehive.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;

import jakarta.persistence.EntityManager;

@DataJpaTest
class UserRepositoryTest {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void findByEmailLoadsScopesForUseAfterTheSessionCloses() {
        User user = new User(
                "Scoped",
                "Admin",
                "2026630001",
                "scoped-admin@example.com",
                "encoded",
                Role.ADMIN);
        user.addScope(Scope.CREATE_USERS);
        userRepository.saveAndFlush(user);
        entityManager.clear();

        User loaded = userRepository.findByEmail(user.getEmail()).orElseThrow();
        entityManager.detach(loaded);

        assertThat(loaded.getAuthorities())
                .extracting("authority")
                .contains("ADMIN", "CREATE_USERS");
    }
}
