package com.github.codehive.model.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;

class UserAuthoritiesTest {
    @Test
    void superAdminInheritsAllScopes() {
        User user = new User("Super", "Admin", "ADMIN-001", "super@example.com", "encoded", Role.ADMIN);
        user.addScope(Scope.SUPER_ADMIN);

        assertThat(user.getAuthorities()).extracting("authority")
                .contains("ADMIN", "SUPER_ADMIN", "CREATE_USERS", "CREATE_ADMINS", "CREATE_GROUP");
    }

    @Test
    void regularAdminReceivesOnlyExplicitlyAssignedScopes() {
        User user = new User("Admin", "User", "ADMIN-002", "admin@example.com", "encoded", Role.ADMIN);
        user.addScope(Scope.VIEW_USERS);
        user.addScope(Scope.CREATE_USERS);

        assertThat(user.getAuthorities()).extracting("authority")
                .contains("ADMIN", "VIEW_USERS", "CREATE_USERS")
                .doesNotContain("UPDATE_USERS", "MANAGE_USER_STATUS", "CREATE_ADMINS");
    }
}
