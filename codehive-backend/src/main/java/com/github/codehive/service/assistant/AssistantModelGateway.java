package com.github.codehive.service.assistant;

/** Provider-neutral, buffered model boundary. Returned text is untrusted. */
public interface AssistantModelGateway {
    String complete(String systemInstruction, String userPayload);
}
