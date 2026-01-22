package com.github.codehive.worker.sandbox.factory;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.github.codehive.worker.model.enums.Language;
import com.github.codehive.worker.sandbox.LanguageExecutor;

@Component
public class LanguageExecutorFactory {
    private static final Logger logger = LoggerFactory.getLogger(LanguageExecutorFactory.class);
    private final Map<String, LanguageExecutor> executors;

    public LanguageExecutorFactory(Map<String, LanguageExecutor> executors) {
        this.executors = executors;
        logger.info("LanguageExecutorFactory initialized with executors: {}", executors.keySet());
    }

    public LanguageExecutor getExecutor(Language language) {
        if (language == null) {
            throw new IllegalArgumentException("Language cannot be null");
        }
        
        LanguageExecutor executor = executors.get(language.name());
        if (executor == null) {
            throw new IllegalArgumentException("No executor found for language: " + language);
        }
        
        return executor;
    }
}
