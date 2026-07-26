package com.github.codehive.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.ApplicationDataMigration;

public interface ApplicationDataMigrationRepository extends JpaRepository<ApplicationDataMigration, String> {}
