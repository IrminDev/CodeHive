package com.github.codehive.ratelimit;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

import java.lang.reflect.Method;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerMapping;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.service.RateLimitIncidentService;

@ExtendWith(MockitoExtension.class)
class RateLimitInterceptorTest {
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    @Mock private RateLimitIncidentService incidentService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatedRejectionRecordsTemplatedEndpointWithoutIp() throws Exception {
        User user = new User("Rate", "Limited", "2026630001", "rate@example.com", "encoded", Role.STUDENT);
        user.setId(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        RateLimitInterceptor interceptor = new RateLimitInterceptor(new RateLimitService(), incidentService);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/demo/123");
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, "/api/demo/{id}");
        request.addHeader("X-Correlation-ID", "correlation-1");
        HandlerMethod handler = handler();

        interceptor.preHandle(request, new MockHttpServletResponse(), handler);

        assertThatThrownBy(() -> interceptor.preHandle(request, new MockHttpServletResponse(), handler))
                .isInstanceOf(RateLimitExceededException.class);
        verify(incidentService).record(USER_ID, "test.strict", "POST", "/api/demo/{id}", "correlation-1");
    }

    private HandlerMethod handler() throws NoSuchMethodException {
        Method method = Fixture.class.getDeclaredMethod("limited");
        return new HandlerMethod(new Fixture(), method);
    }

    private static class Fixture {
        @RateLimit(key = "test.strict", limit = 1, duration = 60)
        public void limited() {}
    }
}
