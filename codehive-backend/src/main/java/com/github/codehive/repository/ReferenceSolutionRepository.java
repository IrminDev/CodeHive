package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.enums.Language;

public interface ReferenceSolutionRepository extends JpaRepository<ReferenceSolution, UUID> {
    List<ReferenceSolution> findByAssignment(Assignment assignment);
    
    Optional<ReferenceSolution> findByAssignmentAndLanguage(Assignment assignment, Language language);
    
    List<ReferenceSolution> findByAssignmentId(UUID assignmentId);
    
    boolean existsByAssignmentAndLanguage(Assignment assignment, Language language);
}
