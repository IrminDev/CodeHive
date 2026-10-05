package com.github.codehive.repository;

import java.util.List;
import java.util.Collection;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.AssignmentFeedback;
import com.github.codehive.model.enums.FeedbackStatus;

public interface AssignmentFeedbackRepository extends JpaRepository<AssignmentFeedback, UUID> {
    List<AssignmentFeedback> findByStudentWorkIdOrderByCreatedAtAsc(UUID studentWorkId);
    List<AssignmentFeedback> findByStudentWorkIdInAndStatus(
            Collection<UUID> studentWorkIds, FeedbackStatus status);

    List<AssignmentFeedback> findByStudentWorkIdIn(Collection<UUID> studentWorkIds);
}
