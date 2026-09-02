package com.github.codehive.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to apply rate limiting to controller methods.
 * 
 * Usage:
 * @RateLimit(limit = 5, duration = 60) // 5 requests per 60 seconds
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    /**
     * Maximum number of requests allowed within the duration
     */
    int limit() default 10;

    /**
     * Time window in seconds
     */
    long duration() default 60;

    /**
     * Optional message to return when rate limit is exceeded
     */
    String message() default "Too many requests. Please try again later.";
}
