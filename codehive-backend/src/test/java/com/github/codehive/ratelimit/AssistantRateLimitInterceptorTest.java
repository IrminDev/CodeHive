package com.github.codehive.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;

import com.github.codehive.controller.AssistantController;
import com.github.codehive.model.request.assistant.AssistantMessageRequest;
import com.github.codehive.service.RateLimitIncidentService;
import com.github.codehive.service.assistant.AssistantService;

class AssistantRateLimitInterceptorTest {
    @Test
    void assistantEndpointEnforcesTenRequestsPerMinuteWithRetryAfter() throws Exception {
        SecurityContextHolder.clearContext();
        RateLimitInterceptor interceptor = new RateLimitInterceptor(new RateLimitService(),
                mock(RateLimitIncidentService.class));
        HandlerMethod handler = new HandlerMethod(new AssistantController(mock(AssistantService.class)),
                AssistantController.class.getMethod("ask", UUID.class, AssistantMessageRequest.class,
                        Authentication.class));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/assignments/id/assistant/interactions");
        request.setRemoteAddr("192.0.2.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        for (int call = 0; call < 10; call++) {
            assertThat(interceptor.preHandle(request, response, handler)).isTrue();
        }
        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler))
                .isInstanceOfSatisfying(RateLimitExceededException.class, error -> {
                    assertThat(error.getPolicy()).isEqualTo("assistant.message");
                    assertThat(error.getLimit()).isEqualTo(10);
                    assertThat(error.getRetryAfterSeconds()).isPositive();
                });
    }
}
