package com.github.codehive.repository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import com.github.codehive.model.entity.AssistantModelCall;
public interface AssistantModelCallRepository extends JpaRepository<AssistantModelCall, UUID> {
    @Query("select coalesce(max(c.callOrdinal), 0) from AssistantModelCall c where c.interaction.id = :id")
    int lastOrdinal(@Param("id") UUID id);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from AssistantModelCall c where c.id = :id")
    Optional<AssistantModelCall> lock(@Param("id") UUID id);
    @Modifying
    @Query("update AssistantModelCall c set c.status = com.github.codehive.model.enums.AssistantModelCallStatus.UNKNOWN, c.failureCode = 'RESULT_UNCERTAIN' where c.status = com.github.codehive.model.enums.AssistantModelCallStatus.STARTED and c.startedAt < :cutoff")
    int markUncertain(@Param("cutoff") Instant cutoff);
}
