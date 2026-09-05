package com.github.codehive.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.github.codehive.model.dto.admin.AdminAuditEventDTO;
import com.github.codehive.model.entity.AdminAuditEvent;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AdminAuditAction;
import com.github.codehive.model.enums.AdminAuditOutcome;
import com.github.codehive.repository.AdminAuditEventRepository;

@Service
public class AdminAuditService {
    private final AdminAuditEventRepository repository;

    public AdminAuditService(AdminAuditEventRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void success(User actor, User target, AdminAuditAction action, String reason, String details) {
        repository.save(new AdminAuditEvent(actor, target, action, AdminAuditOutcome.SUCCESS,
                normalizeReason(reason), details, correlationId()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void failure(User actor, User target, AdminAuditAction action, String reason, String details) {
        repository.save(new AdminAuditEvent(actor, target, action, AdminAuditOutcome.FAILURE,
                normalizeReason(reason), details, correlationId()));
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditEventDTO> list(UUID actorId, UUID targetId, AdminAuditAction action,
                                         AdminAuditOutcome outcome, Instant from, Instant to,
                                         int page, int size) {
        Specification<AdminAuditEvent> spec = Specification.allOf();
        if (actorId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("actor").get("id"), actorId));
        if (targetId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("target").get("id"), targetId));
        if (action != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), action));
        if (outcome != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("outcome"), outcome));
        if (from != null) spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
        if (to != null) spec = spec.and((root, query, cb) -> cb.lessThan(root.get("occurredAt"), to));
        return repository.findAll(spec, PageRequest.of(page, size,
                        Sort.by(Sort.Direction.DESC, "occurredAt")))
                .map(this::toDto);
    }

    private AdminAuditEventDTO toDto(AdminAuditEvent event) {
        User actor = event.getActor();
        User target = event.getTarget();
        boolean actorVisible = actor != null && actor.isApplicationVisible();
        boolean targetVisible = target != null && target.isApplicationVisible();
        return new AdminAuditEventDTO(
                event.getId(), actorVisible ? actor.getId() : null,
                displayName(actor, actorVisible), targetVisible ? target.getId() : null,
                displayName(target, targetVisible), event.getAction(), event.getOutcome(),
                event.getReason(), event.getDetails(), event.getOccurredAt(), event.getCorrelationId());
    }

    private String displayName(User user, boolean visible) {
        if (user == null) return null;
        if (!visible) return "Deleted user";
        return (user.getName() + " " + user.getLastName()).trim();
    }

    private String normalizeReason(String reason) {
        return reason == null || reason.isBlank() ? "Administrative operation" : reason.trim();
    }

    private String correlationId() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest().getHeader("X-Correlation-ID");
        }
        return null;
    }
}
