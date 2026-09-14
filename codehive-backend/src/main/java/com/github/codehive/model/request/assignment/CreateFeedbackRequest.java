package com.github.codehive.model.request.assignment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFeedbackRequest(
        @NotBlank @Size(max = 10000) String body
) {
}
