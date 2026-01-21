package com.github.codehive.model.entity;

import java.time.LocalDateTime;

import ch.qos.logback.classic.spi.Configurator.ExecutionStatus;

public class Execution {
    private Long id;
    private Submission submission;    
    private ExecutionStatus status;
    private Long timeMs;
    private Long memoryMb;
    private Boolean isOutdated;
    private LocalDateTime createdAt;
}
