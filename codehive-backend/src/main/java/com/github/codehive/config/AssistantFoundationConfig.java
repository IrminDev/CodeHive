package com.github.codehive.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AssistantFoundationConfig {
    @Bean("assistantClock")
    Clock assistantClock() {
        return Clock.systemUTC();
    }
}
