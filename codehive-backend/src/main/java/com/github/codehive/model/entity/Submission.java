package com.github.codehive.model.entity;

import java.time.LocalDateTime;

import com.github.codehive.model.enums.Language;

public class Submission {
    private Long id;
    private Assignment assignment;
    private Language language;
    private LocalDateTime createdAt;
}
