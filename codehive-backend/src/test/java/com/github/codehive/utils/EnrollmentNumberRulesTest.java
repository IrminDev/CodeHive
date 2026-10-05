package com.github.codehive.utils;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import com.github.codehive.model.enums.Role;

class EnrollmentNumberRulesTest {
    @Test
    void rejectsMissingRole() {
        assertThat(EnrollmentNumberRules.error(null, "TEA-001")).isEqualTo("Role is required");
    }

    @ParameterizedTest
    @ValueSource(strings = {"1994630001", "2026630999", "9999630000"})
    void acceptsInstitutionalStudentNumbers(String enrollmentNumber) {
        assertThat(EnrollmentNumberRules.error(Role.STUDENT, enrollmentNumber)).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"TEA-001", "ADMIN_01", "staff.2", "A1"})
    void acceptsShortAlphanumericStaffNumbers(String enrollmentNumber) {
        assertThat(EnrollmentNumberRules.error(Role.TEACHER, enrollmentNumber)).isNull();
        assertThat(EnrollmentNumberRules.error(Role.ADMIN, enrollmentNumber)).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"TEA-001", "202663000", "1993630001", "2026640001"})
    void rejectsNonInstitutionalStudentNumbers(String enrollmentNumber) {
        assertThat(EnrollmentNumberRules.error(Role.STUDENT, enrollmentNumber))
                .isEqualTo(EnrollmentNumberRules.STUDENT_MESSAGE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"STAFF 1", "ADMIN@1", "12345678901"})
    void rejectsInvalidStaffNumbers(String enrollmentNumber) {
        assertThat(EnrollmentNumberRules.error(Role.TEACHER, enrollmentNumber))
                .isEqualTo(EnrollmentNumberRules.STAFF_MESSAGE);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"TEACHER", "ADMIN"})
    void appliesStaffRulesToNonStudentRoles(Role role) {
        assertThat(EnrollmentNumberRules.error(role, "ROLE-01")).isNull();
    }
}
