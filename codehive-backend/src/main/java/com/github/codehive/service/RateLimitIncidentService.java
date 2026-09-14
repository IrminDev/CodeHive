package com.github.codehive.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.admin.RateLimitIncidentDTO;
import com.github.codehive.model.entity.RateLimitIncident;
import com.github.codehive.model.entity.User;
import com.github.codehive.repository.RateLimitIncidentRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class RateLimitIncidentService {
    private final RateLimitIncidentRepository incidentRepository;
    private final UserRepository userRepository;

    public RateLimitIncidentService(RateLimitIncidentRepository incidentRepository,
                                    UserRepository userRepository) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID userId, String policy, String method, String route, String correlationId) {
        User user = userRepository.findById(userId)
                .filter(User::isApplicationVisible)
                .orElse(null);
        if (user == null) return;
        Instant occurredAt = Instant.now();
        incidentRepository.save(new RateLimitIncident(user, policy, method, route, correlationId));
        userRepository.incrementRateLimitViolation(userId, occurredAt);
    }

    @Transactional(readOnly = true)
    public Page<RateLimitIncidentDTO> list(UUID userId, String policy, String method,
                                           String endpoint, Instant from, Instant to,
                                           int page, int size) {
        Specification<RateLimitIncident> spec = (root, query, cb) -> cb.isTrue(root.get("user").get("isActive"));
        if (userId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("user").get("id"), userId));
        if (policy != null && !policy.isBlank()) spec = spec.and((root, query, cb) -> cb.equal(root.get("policyKey"), policy));
        if (method != null && !method.isBlank()) spec = spec.and((root, query, cb) -> cb.equal(root.get("httpMethod"), method.toUpperCase()));
        if (endpoint != null && !endpoint.isBlank()) spec = spec.and((root, query, cb) -> cb.equal(root.get("routeTemplate"), endpoint));
        if (from != null) spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
        if (to != null) spec = spec.and((root, query, cb) -> cb.lessThan(root.get("occurredAt"), to));
        return incidentRepository.findAll(spec, PageRequest.of(page, size,
                        Sort.by(Sort.Direction.DESC, "occurredAt")))
                .map(this::toDto);
    }

    @Scheduled(cron = "${rate-limit.incident-cleanup-cron:0 15 3 * * *}")
    @Transactional
    public void cleanup() {
        incidentRepository.deleteByOccurredAtBefore(Instant.now().minus(180, ChronoUnit.DAYS));
    }

    private RateLimitIncidentDTO toDto(RateLimitIncident incident) {
        User user = incident.getUser();
        return new RateLimitIncidentDTO(incident.getId(), user.getId(),
                (user.getName() + " " + user.getLastName()).trim(), incident.getPolicyKey(),
                incident.getHttpMethod(), incident.getRouteTemplate(), incident.getOccurredAt(),
                incident.getCorrelationId());
    }
}
