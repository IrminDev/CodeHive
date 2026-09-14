package com.github.codehive.utils;

import java.util.regex.Pattern;

import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.ValidationException;

public final class EnrollmentNumberRules {
    public static final String STUDENT_MESSAGE =
            "Enrollment number must be 10 digits: year (>=1994), followed by 630, followed by any 3 digits";
    public static final String STAFF_MESSAGE =
            "Enrollment number must be at most 10 characters and contain only letters, digits, '-', '.', or '_'";

    private static final Pattern STUDENT_PATTERN =
            Pattern.compile("^(199[4-9]|[2-9]\\d{3})630\\d{3}$");
    private static final Pattern STAFF_PATTERN =
            Pattern.compile("^[A-Za-z0-9._-]{1,10}$");

    private EnrollmentNumberRules() {
    }

    public static String error(Role role, String enrollmentNumber) {
        if (role == null) {
            return "Role is required";
        }
        if (enrollmentNumber == null || enrollmentNumber.isBlank()) {
            return "Enrollment number is required";
        }
        if (role == Role.STUDENT) {
            return STUDENT_PATTERN.matcher(enrollmentNumber).matches()
                    ? null : STUDENT_MESSAGE;
        }
        return STAFF_PATTERN.matcher(enrollmentNumber).matches()
                ? null : STAFF_MESSAGE;
    }

    public static void validate(Role role, String enrollmentNumber) {
        String error = error(role, enrollmentNumber);
        if (error != null) throw new ValidationException(error);
    }
}
