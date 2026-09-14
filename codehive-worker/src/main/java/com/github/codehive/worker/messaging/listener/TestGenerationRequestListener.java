package com.github.codehive.worker.messaging.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.github.codehive.worker.messaging.producer.TestGenerationResultProducer;
import com.github.codehive.worker.model.dto.queue.TestGenerationJob;
import com.github.codehive.worker.model.dto.queue.TestGenerationResult;
import com.github.codehive.worker.service.TestGenerationService;

@Component
public class TestGenerationRequestListener {
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationRequestListener.class);

    private final TestGenerationService testGenerationService;
    private final TestGenerationResultProducer testGenerationResultProducer;

    public TestGenerationRequestListener(TestGenerationService testGenerationService,
                                          TestGenerationResultProducer testGenerationResultProducer) {
        this.testGenerationService = testGenerationService;
        this.testGenerationResultProducer = testGenerationResultProducer;
    }

    @RabbitListener(queues = "${rabbitmq.test-generation.queue:codehive_test_generation_queue}")
    public void handleTestGenerationJob(TestGenerationJob job) {
        logger.info("[WORKFLOW] RABBITMQ RECEIVE: Test generation job received - assignmentId={}, testCases={}, language={}",
                job.getAssignmentId(), job.getTestCases().size(), job.getReferenceLanguage());

        TestGenerationResult result;
        try {
            result = testGenerationService.generateOutputs(job);
        } catch (Exception e) {
            logger.error("[WORKFLOW] Unexpected error during test generation - assignmentId={}",
                    job.getAssignmentId(), e);
            result = new TestGenerationResult(job.getAssignmentId(), false, 0,
                    "Unexpected error: " + e.getMessage());
            result.setAssignmentUpdateId(job.getAssignmentUpdateId());
            result.setTestSuiteRevisionId(job.getTestSuiteRevisionId());
            result.setReferenceSolutionRevisionId(job.getReferenceSolutionRevisionId());
        }

        testGenerationResultProducer.sendTestGenerationResult(result);
    }
}
