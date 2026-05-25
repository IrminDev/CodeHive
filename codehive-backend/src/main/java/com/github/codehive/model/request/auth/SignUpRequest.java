package com.github.codehive.model.request.auth;

import com.github.codehive.model.enums.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SignUpRequest {
    @NotNull(message = "Role is required")
    private Role role;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Father last name is required")
    @Size(min = 2, max = 40, message = "Father last name must be between 2 and 40 characters")
    private String fatherLastName;

    @NotBlank(message = "Mother last name is required")
    @Size(min = 2, max = 40, message = "Mother last name must be between 2 and 40 characters")
    private String motherLastName;

    @NotBlank(message = "Enrollment number is required")
    @Pattern(
        regexp = "^(199[4-9]|[2-9]\\d{3})630\\d{3}$",
        message = "Enrollment number must be 10 digits: year (>=1994), followed by 630, followed by any 3 digits"
    )
    private String enrollmentNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFatherLastName() {
        return fatherLastName;
    }

    public void setFatherLastName(String fatherLastName) {
        this.fatherLastName = fatherLastName;
    }

    public String getMotherLastName() {
        return motherLastName;
    }

    public void setMotherLastName(String motherLastName) {
        this.motherLastName = motherLastName;
    }

    public String getEnrollmentNumber() {
        return enrollmentNumber;
    }

    public void setEnrollmentNumber(String enrollmentNumber) {
        this.enrollmentNumber = enrollmentNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
