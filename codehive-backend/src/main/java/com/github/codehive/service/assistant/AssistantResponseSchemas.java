package com.github.codehive.service.assistant;

import com.github.codehive.model.enums.AssistantModelCallStage;

/** Provider schemas constrain shape; local and semantic checks still decide approval. */
final class AssistantResponseSchemas {
    private AssistantResponseSchemas() {}

    static String forStage(AssistantModelCallStage stage) {
        return switch (stage) {
            case INPUT_REVIEW -> """
                    {"type":"object","properties":{"decision":{"type":"string",
                    "enum":["ALLOW","REDIRECT","BLOCK"]}},"required":["decision"],
                    "additionalProperties":false}
                    """;
            case ANSWER_GENERATION -> """
                    {"type":"object","properties":{
                      "explanation":{"type":"string"},
                      "snippets":{"type":"array","maxItems":2,"items":{
                        "type":"object","properties":{
                          "language":{"type":"string"},"code":{"type":"string"}},
                        "required":["language","code"],"additionalProperties":false}},
                      "followUpQuestion":{"type":"string"}},
                    "required":["explanation","snippets","followUpQuestion"],
                    "additionalProperties":false}
                    """;
            // Retained for reading historical stage records, not used by the current flow.
            case OUTPUT_REVIEW, POLICY_REVALIDATION -> """
                    {"type":"object","properties":{"approved":{"type":"boolean"}},
                    "required":["approved"],"additionalProperties":false}
                    """;
        };
    }
}
