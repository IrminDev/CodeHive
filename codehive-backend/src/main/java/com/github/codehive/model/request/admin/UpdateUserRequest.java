package com.github.codehive.model.request.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {
    @NotBlank @Size(min = 2, max = 50)
    private String name;

    @NotBlank @Size(min = 2, max = 80)
    private String lastName;

    @NotBlank
    @Size(max = 10, message = "Enrollment number must not exceed 10 characters")
    private String enrollmentNumber;

    @NotBlank @Email @Size(max = 100)
    private String email;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String enrollmentNumber) { this.enrollmentNumber = enrollmentNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
