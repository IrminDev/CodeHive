package com.github.codehive.service.assistant;

import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AssistantLeaseRecoveryJob {
    private final AssistantTransactionService transactions;

    public AssistantLeaseRecoveryJob(AssistantTransactionService transactions) {
        this.transactions = transactions;
    }

    @Scheduled(fixedDelayString = "${assistant.lease-recovery-ms:60000}")
    public void recoverExpired() {
        for (UUID id : transactions.expiredIds()) transactions.recoverOne(id);
    }
}
