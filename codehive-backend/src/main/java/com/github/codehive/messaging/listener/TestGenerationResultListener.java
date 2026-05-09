package com.github.codehive.messaging.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.github.codehive.model.dto.queue.TestGenerationResult;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.repository.AssignmentRepository;

@Component
public class TestGenerationResultListener {
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationResultListener.class);

    private final AssignmentRepository assignmentRepository;

    public TestGenerationResultListener(AssignmentRepository assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }

    @RabbitListener(queues = "${rabbitmq.test-generation.result.queue:codehive_test_generation_result_queue}")
    public void handleTestGenerationResult(TestGenerationResult result) {
        logger.info("[WORKFLOW] RABBITMQ RECEIVE: Test generation result - assignmentId={}, success={}, generated={}",
                result.getAssignmentId(), result.isSuccess(), result.getGeneratedCount());

        Assignment assignment = assignmentRepository.findById(result.getAssignmentId()).orElse(null);
        if (assignment == null) {
            logger.warn("[WORKFLOW] Assignment not found for test generation result - assignmentId={}",
                    result.getAssignmentId());
            return;
        }

        if (result.isSuccess()) {
            assignment.setIsActive(true);
            assignmentRepository.save(assignment);
            logger.info("[WORKFLOW] Assignment activated after test generation - assignmentId={}, generatedOutputs={}",
                    assignment.getId(), result.getGeneratedCount());
        } else {
            logger.error("[WORKFLOW] Test generation failed for assignmentId={}, error={}",
                    result.getAssignmentId(), result.getErrorMessage());
        }
    }
}
