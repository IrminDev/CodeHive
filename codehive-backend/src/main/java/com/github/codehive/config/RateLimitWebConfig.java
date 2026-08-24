package com.github.codehive.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.github.codehive.ratelimit.RateLimitInterceptor;

@Configuration
@Profile("!test")
public class RateLimitWebConfig implements WebMvcConfigurer {
    private final RateLimitInterceptor interceptor;

    public RateLimitWebConfig(RateLimitInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor).addPathPatterns("/api/**");
    }
}
