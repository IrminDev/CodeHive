package com.github.codehive.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.servlet.http.HttpServletRequest;

@DisplayName("RateLimitAspect client key resolution")
class RateLimitAspectTest {

    private RateLimitAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new RateLimitAspect(mock(RateLimitService.class));
    }

    @Test
    @DisplayName("Ignores X-Forwarded-For and uses remote address when not trusting the header")
    void getClientKey_whenNotTrustingForwardedFor_usesRemoteAddr() {
        ReflectionTestUtils.setField(aspect, "trustForwardedFor", false);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("10.0.0.5");

        assertThat(aspect.getClientKey(request)).isEqualTo("10.0.0.5");
    }

    @Test
    @DisplayName("Spoofed X-Forwarded-For does not change the key when not trusting the header")
    void getClientKey_whenNotTrustingForwardedFor_ignoresSpoofedHeader() {
        ReflectionTestUtils.setField(aspect, "trustForwardedFor", false);
        HttpServletRequest first = mock(HttpServletRequest.class);
        when(first.getRemoteAddr()).thenReturn("10.0.0.5");
        HttpServletRequest second = mock(HttpServletRequest.class);
        when(second.getRemoteAddr()).thenReturn("10.0.0.5");

        String keyForSpoofedA = aspect.getClientKey(first);
        String keyForSpoofedB = aspect.getClientKey(second);

        assertThat(keyForSpoofedA).isEqualTo("10.0.0.5");
        assertThat(keyForSpoofedB).isEqualTo(keyForSpoofedA);
    }

    @Test
    @DisplayName("Uses the first X-Forwarded-For entry when trusting the header")
    void getClientKey_whenTrustingForwardedFor_usesFirstEntry() {
        ReflectionTestUtils.setField(aspect, "trustForwardedFor", true);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.7, 10.0.0.1");

        assertThat(aspect.getClientKey(request)).isEqualTo("203.0.113.7");
    }

    @Test
    @DisplayName("Falls back to remote address when trusting the header but it is absent")
    void getClientKey_whenTrustingForwardedFor_fallsBackToRemoteAddr() {
        ReflectionTestUtils.setField(aspect, "trustForwardedFor", true);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.5");

        assertThat(aspect.getClientKey(request)).isEqualTo("10.0.0.5");
    }
}
