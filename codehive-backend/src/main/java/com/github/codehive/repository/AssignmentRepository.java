package com.github.codehive.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.Assignment;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findAllByOrderByCreatedAtDesc();
    
    List<Assignment> findByTitleContainingIgnoreCase(String title);
    
    List<Assignment> findByDueDateBefore(LocalDateTime date);
    
    List<Assignment> findByDueDateAfter(LocalDateTime date);
    
    Optional<Assignment> findByIdAndDueDateAfter(Long id, LocalDateTime date);
}
