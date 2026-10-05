package com.github.codehive.service.assistant;

/** Provider-neutral, buffered model boundary. Returned text is untrusted. */
public interface AssistantModelGateway {
    default AssistantModelResult complete(AssistantModelCallContext context, String systemInstruction, String userPayload) {
        return new AssistantModelResult(complete(systemInstruction, userPayload), null, null, null, null);
    }
    String complete(String systemInstruction, String userPayload);
}
