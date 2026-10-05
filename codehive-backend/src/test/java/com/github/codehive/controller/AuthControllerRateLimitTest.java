package com.github.codehive.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import com.github.codehive.model.request.auth.UpdatePasswordRequest;
import com.github.codehive.ratelimit.RateLimit;

@DisplayName("AuthController rate-limit annotations")
class AuthControllerRateLimitTest {

    @Test
    @DisplayName("password change endpoint is rate limited")
    void updatePassword_isRateLimited() throws Exception {
        Method method = AuthController.class.getMethod(
                "updatePassword", Authentication.class, UpdatePasswordRequest.class);

        RateLimit rateLimit = method.getAnnotation(RateLimit.class);

        assertThat(rateLimit).isNotNull();
        assertThat(rateLimit.limit()).isPositive();
        assertThat(rateLimit.duration()).isPositive();
    }
}
