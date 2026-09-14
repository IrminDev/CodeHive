package com.github.codehive.ratelimit;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import com.github.codehive.model.entity.User;
import com.github.codehive.service.RateLimitIncidentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Profile("!test")
public class RateLimitInterceptor implements HandlerInterceptor {
    private static final int GLOBAL_LIMIT = 300;
    private static final long GLOBAL_WINDOW_SECONDS = 60;

    private final RateLimitService rateLimitService;
    private final RateLimitIncidentService incidentService;

    public RateLimitInterceptor(RateLimitService rateLimitService,
                                RateLimitIncidentService incidentService) {
        this.rateLimitService = rateLimitService;
        this.incidentService = incidentService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) return true;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = authenticatedUser(authentication);
        String subject = user == null ? "ip:" + request.getRemoteAddr() : "user:" + user.getId();
        String route = route(request);

        if (user != null) {
            enforce(subject, "global.authenticated", GLOBAL_LIMIT, GLOBAL_WINDOW_SECONDS,
                    "Too many requests", user.getId(), request, route);
        }

        RateLimit policy = handlerMethod.getMethodAnnotation(RateLimit.class);
        if (policy != null) {
            String policyKey = policy.key().isBlank()
                    ? handlerMethod.getBeanType().getSimpleName() + "." + handlerMethod.getMethod().getName()
                    : policy.key();
            enforce(subject, policyKey, policy.limit(), policy.duration(), policy.message(),
                    user == null ? null : user.getId(), request, route);
        }
        return true;
    }

    private void enforce(String subject, String policy, int limit, long duration, String message,
                         UUID userId, HttpServletRequest request, String route) {
        RateLimitService.Decision decision = rateLimitService.consume(subject, policy, limit, duration);
        if (decision.allowed()) return;
        if (userId != null) {
            incidentService.record(userId, policy, request.getMethod(), route,
                    request.getHeader("X-Correlation-ID"));
        }
        throw new RateLimitExceededException(message, policy, limit, decision.retryAfterSeconds());
    }

    private User authenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) return null;
        return authentication.getPrincipal() instanceof User user ? user : null;
    }

    private String route(HttpServletRequest request) {
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return pattern == null ? request.getRequestURI() : pattern.toString();
    }
}
