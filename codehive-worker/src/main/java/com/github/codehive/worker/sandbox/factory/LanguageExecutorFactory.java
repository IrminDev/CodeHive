package com.github.codehive.worker.sandbox.factory;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.github.codehive.worker.sandbox.LanguageExecutor;

@Component
public class LanguageExecutorFactory {
    private final Map<String, LanguageExecutor> executors;

    public LanguageExecutorFactory(Map<String, LanguageExecutor> executors) {
        this.executors = executors;
    }

    public LanguageExecutor getExecutor(String language) {
        return executors.get(language);
    }
}
