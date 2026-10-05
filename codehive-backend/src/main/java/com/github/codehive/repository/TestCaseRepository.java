package com.github.codehive.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.TestCase;

public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {
    List<TestCase> findByTestSuiteRevisionIdOrderByOrderAsc(UUID testSuiteRevisionId);

    List<TestCase> findByTestSuiteRevisionIdAndIsSampleOrderByOrderAsc(
            UUID testSuiteRevisionId, Boolean isSample);

    long countByTestSuiteRevisionId(UUID testSuiteRevisionId);
}
