package com.github.codehive.model.entity;

import java.time.LocalDateTime;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;


public class Execution {
    private Long id;
    private Submission submission; // NULLABLE
    private ExecutionType executionType;
    private ExecutionStatus status;
    private Long timeMs;
    private Long memoryMb;
    private Boolean isOutdated;
    private LocalDateTime createdAt;
}
