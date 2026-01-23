package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.enums.Language;

public interface ReferenceSolutionRepository extends JpaRepository<ReferenceSolution, Long> {
    List<ReferenceSolution> findByAssignment(Assignment assignment);
    
    Optional<ReferenceSolution> findByAssignmentAndLanguage(Assignment assignment, Language language);
    
    List<ReferenceSolution> findByAssignmentId(Long assignmentId);
    
    boolean existsByAssignmentAndLanguage(Assignment assignment, Language language);
}
