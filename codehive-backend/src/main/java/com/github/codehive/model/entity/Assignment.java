package com.github.codehive.model.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.github.codehive.model.enums.ComparatorType;

public class Assignment {
    private Long id;
    private String title;
    private String description;
    private List<String> constraints;
    private List<String> hints;
    private List<String> tags;
    private Integer timeLimitMs;
    private Integer memoryLimitMb;
    private ComparatorType comparatorType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime dueDate;

    
}
