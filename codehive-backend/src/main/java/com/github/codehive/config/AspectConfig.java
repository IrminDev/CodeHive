package com.github.codehive.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * Configuration for enabling AOP (Aspect-Oriented Programming)
 * Required for rate limiting aspect to work
 */
@Configuration
@EnableAspectJAutoProxy
public class AspectConfig {
}
