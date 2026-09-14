package com.github.codehive.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.github.codehive.model.entity.AdminAuditEvent;

public interface AdminAuditEventRepository extends JpaRepository<AdminAuditEvent, UUID>,
        JpaSpecificationExecutor<AdminAuditEvent> {
}
