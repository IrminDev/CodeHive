package com.github.codehive.ratelimit;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
@Profile("!test")
public class RateLimitAspect {
    private static final Logger logger = LoggerFactory.getLogger(RateLimitAspect.class);
    
    private final RateLimitService rateLimitService;

    /**
     * Whether to trust the {@code X-Forwarded-For} header for the client IP.
     * Only enable when the app sits behind a trusted reverse proxy that sets it;
     * otherwise the header is client-controlled and can be spoofed to bypass limits.
     */
    @Value("${ratelimit.trust-forwarded-for:false}")
    private boolean trustForwardedFor;

    public RateLimitAspect(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Around("@annotation(com.github.codehive.ratelimit.RateLimit)")
    public Object rateLimit(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        RateLimit rateLimit = signature.getMethod().getAnnotation(RateLimit.class);

        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = requestAttributes.getRequest();
        
        String key = getClientKey(request);
        
        boolean allowed = rateLimitService.tryConsume(key, rateLimit.limit(), rateLimit.duration());
        
        if (!allowed) {
            logger.warn("Rate limit exceeded for key: {} on endpoint: {}", key, request.getRequestURI());
            throw new RateLimitExceededException(rateLimit.message());
        }

        return joinPoint.proceed();
    }

    /**
     * Resolve the rate-limit key for the caller from its IP address.
     * The client-supplied {@code X-Forwarded-For} header is only honored when
     * {@code ratelimit.trust-forwarded-for} is enabled (i.e. behind a trusted
     * proxy); otherwise it is ignored and the direct peer address is used, so
     * the header cannot be spoofed to obtain a fresh bucket per request.
     */
    String getClientKey(HttpServletRequest request) {
        if (trustForwardedFor) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                return xForwardedFor.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
