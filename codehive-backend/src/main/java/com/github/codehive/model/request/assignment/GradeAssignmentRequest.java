package com.github.codehive.model.request.assignment;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record GradeAssignmentRequest(
        @NotNull @DecimalMin("0.00") BigDecimal value
) {
}
