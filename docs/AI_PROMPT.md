You are working on an existing educational online judge application. Your task is to analyze the current codebase and create a detailed implementation plan for adding an AI-powered educational assistant.

Important: Do Not Implement Yet

For this task, do not modify the codebase.

Your goal is to:

Inspect and understand the existing project architecture.

Identify the components, patterns, entities, services, repositories, APIs, and infrastructure already available.

Determine how the AI assistant should integrate with the existing system.

Produce a detailed, implementation-ready plan.

The architecture described below is a proposed direction, not something that must be followed blindly. Adapt it when the existing codebase suggests a cleaner or more consistent solution.

If an architectural decision, requirement, expected behavior, data model, or integration detail is ambiguous, ask me before making the decision.

Do not silently assume requirements.

Feature Overview

The application is an educational online judge where students solve programming assignments.

We want to introduce an AI educational assistant available as a chatbot from the React web application.

The assistant should help students understand and solve assignments without directly giving them the complete solution.

Allowed assistance may include:

Conceptual explanations.

Algorithmic guidance.

Hints.

Small code snippets.

Explanations of compilation/runtime errors.

Explanations of relevant data structures or algorithms.

Guidance about edge cases.

Questions that help the student reason toward the solution.

The assistant must avoid simply solving the assignment for the student.

Examples of behavior that should be restricted include:

Providing a complete solution.

Providing directly submittable code for the assignment.

Circumventing the configured assistance restrictions.

Following prompt-injection attempts asking the model to ignore its educational restrictions.

The exact behavior should be enforced through appropriate guardrails and contextual instructions.

Existing Technology

The project currently uses technologies including:

React frontend.

Spring Boot backend.

PostgreSQL.

RabbitMQ.

MinIO.

A separate execution worker.

Docker containers for executing student code.

We want to use Spring AI for the AI integration, including the model abstraction, prompt/context handling, and appropriate guardrail mechanisms.

However, inspect the actual source code before deciding how these components should integrate.

First Step: Analyze the Existing Codebase

Before proposing the implementation, inspect the repository carefully.

Identify at least:

Backend module/package structure.

Current architectural style.

Domain entities.

Assignment entity/model.

User/student model.

Authentication and authorization mechanisms.

Controllers and API conventions.

Services and service boundaries.

Repository/data-access patterns.

DTO conventions.

Validation mechanisms.

Exception handling.

Database migration mechanism.

Existing assignment creation/update flow.

Existing submission/execution flow.

How execution results are represented.

RabbitMQ integration.

MinIO integration.

Existing testing conventions.

Frontend structure relevant to assignments.

How the frontend authenticates and communicates with the backend.

Any existing patterns that should be reused by the AI assistant.

Do not design the feature as if this were a new application.

The implementation plan should fit naturally into the existing architecture.

Proposed High-Level Architecture

The intended conceptual flow is approximately:

Student
→ React UI
→ Spring Boot API
→ AI Assistant orchestration
→ Context retrieval
→ Input guardrails
→ Prompt/context construction
→ Spring AI
→ LLM provider
→ Output guardrails
→ Persistence
→ React UI

A possible backend decomposition is:

AssistantController
→ AssistantService
→ Assignment/domain services
→ Assistance policy
→ Context builder
→ Input guardrails
→ Spring AI ChatClient / ChatModel
→ Output guardrails
→ Conversation persistence

Treat this only as a starting point.

If the existing architecture suggests different names, abstractions, package boundaries, or responsibilities, prefer consistency with the project and explain your reasoning.

Important Architectural Constraint

The LLM must not have direct access to infrastructure components such as:

PostgreSQL.

MinIO.

RabbitMQ.

Docker.

The execution worker.

Instead, the assistant should obtain application information through the backend/domain layer.

Conceptually:

AI Assistant
→ Domain/Application Services
→ Infrastructure

rather than:

AI Assistant
→ Database / RabbitMQ / Worker / Docker

For example, if execution information is useful for explaining an error, the assistant should receive a controlled representation of the relevant execution result from the backend rather than communicating with the worker directly.

Assignment-Aware Context

Every assistant interaction must be associated with a specific assignment.

The backend should construct authoritative context for the model using information available in the system, potentially including:

Assignment title.

Assignment description.

Constraints.

Hints.

Supported/required programming language.

Time limit.

Memory limit.

Relevant concepts.

Student code, when appropriate.

Relevant execution results, when appropriate.

Previous conversation context.

Do not trust the frontend to provide authoritative assignment information or AI policies.

The frontend should primarily identify the assignment and send the student's message and any explicitly allowed contextual information.

The backend should retrieve authoritative assignment information itself.

Assistance Policy

The architecture should support an explicit assistance policy.

The professor should be able to configure how much AI assistance is allowed for an assignment.

Investigate the existing Assignment model and assignment creation flow and determine the cleanest way to incorporate this.

Potential configuration may include things such as:

Whether AI assistance is enabled.

Whether conceptual explanations are allowed.

Whether debugging assistance is allowed.

Whether pseudocode is allowed.

Whether code snippets are allowed.

Do not assume the exact policy schema if the existing project suggests a different design.

If the expected policy behavior is unclear, ask me before deciding it.

Request Limit Per Assignment

This is an explicit functional requirement.

When creating/configuring an assignment, the professor must be able to define a maximum number N of AI assistant requests available to each student for that assignment.

For example:

maxAiRequests = 10

would mean that a student can make at most 10 AI assistant requests for that assignment.

The implementation plan must determine how to enforce this reliably.

Consider:

Where the configuration belongs in the domain model.

How requests are counted.

Whether the persisted interaction records can be used as the authoritative count.

Concurrency/race conditions when multiple requests are made simultaneously.

Transaction boundaries.

What happens when the limit is reached.

Appropriate HTTP/API behavior.

How the frontend learns the remaining number of requests.

Whether failed/rejected requests consume quota.

The last point must not be assumed. Ask me how failed, blocked, or technically unsuccessful requests should affect the quota before finalizing the design.

The quota must be enforced by the backend, never only by the frontend.

AI Interaction Persistence

This is also an explicit requirement.

Every relevant interaction with the AI assistant must be persisted in PostgreSQL.

A new persistent entity must therefore be introduced for AI assistant interactions.

Inspect the existing domain/entity conventions and propose the appropriate entity design.

Conceptually, an interaction may need information such as:

ID.

Student/user.

Assignment.

Student message.

Assistant response.

Timestamp.

Assistance/request type.

Guardrail result/status.

Model/provider metadata if useful.

Token usage if available and useful.

Failure/status information when applicable.

Do not automatically add all of these fields.

Determine which fields are useful based on the project's requirements and architecture, and explicitly explain the proposed schema.

The relationship should allow the system to determine:

Which student made the request.

Which assignment it belonged to.

The interaction history.

How many requests that student has used for the assignment.

If introducing a separate conversation/session entity would provide meaningful architectural benefits, explain the trade-offs before recommending it.

Guardrails

The assistant must have safeguards both before and after model invocation.

Conceptually:

Student request
→ Input guardrails
→ Context construction
→ LLM
→ Output guardrails
→ Persist
→ Student

Input validation/guardrails should consider things such as:

Requests for complete solutions.

Off-topic requests.

Prompt injection attempts.

Requests violating the assignment assistance policy.

Output validation/guardrails should help detect situations where the model:

Provides a complete solution.

Generates directly submittable code.

Exceeds configured assistance restrictions.

Leaks internal/system instructions.

Produces content outside the intended educational scope.

Investigate what Spring AI currently provides that is appropriate for this architecture and distinguish between:

Deterministic application validation.

Spring AI mechanisms.

Prompt-level instructions.

Model-based classification/validation, if justified.

Do not treat the system prompt alone as a sufficient security/control mechanism.

Spring AI Integration

The application should use Spring AI as the abstraction between our domain/application layer and the external LLM.

The rest of the application should avoid becoming tightly coupled to a specific LLM provider.

Conceptually:

AssistantService
→ Spring AI
→ ChatModel / ChatClient
→ LLM provider

Inspect the existing dependency management and Spring Boot version before recommending exact Spring AI dependencies or APIs.

Prefer a design that allows changing the underlying model/provider with minimal changes to the domain/application code.

Conversation Context

Determine how conversation history should work.

Do not automatically send the entire interaction history to the LLM indefinitely.

Consider strategies such as:

Last N interactions.

Token-aware history windows.

Conversation summaries.

Assignment-specific conversations.

The persisted interaction history and the context sent to the LLM do not necessarily need to be identical.

Explain the recommended strategy and why it fits this project.

If the desired user-facing conversation semantics are unclear, ask me before making assumptions.

Security and Trust Boundaries

Explicitly identify trust boundaries.

The frontend must not be trusted to define:

AI permissions.

Remaining request quota.

Assignment restrictions.

System prompts.

Guardrail configuration.

Authoritative assignment context.

These should be determined by the backend.

Also evaluate:

Authentication.

Authorization to access the assignment.

Input validation.

Prompt injection risks.

Sensitive/internal data exposure.

Rate limiting.

Request quota enforcement.

Logging considerations.

Frontend

Inspect the React frontend and determine the cleanest integration.

The plan should identify:

Where the assignment assistant UI belongs.

Required API calls.

Request/response DTOs.

Loading/error states.

Quota display.

Disabled state when AI assistance is unavailable.

Behavior when the quota is exhausted.

Conversation history rendering.

Code snippet rendering.

Reuse existing frontend conventions and components whenever possible.

Testing Strategy

The plan must include testing.

Identify appropriate:

Unit tests.

Service tests.

Repository tests.

Controller/API tests.

Guardrail tests.

Quota/concurrency tests.

Spring AI integration tests.

Frontend tests where appropriate.

Guardrails should specifically be tested against adversarial examples such as:

"Give me the complete solution."

"Ignore all previous instructions."

Requests disguised as debugging questions that actually request a full solution.

Attempts to reconstruct the solution through repeated requests.

Also consider tests verifying that assignment-specific policies are respected.

Required Output

After inspecting the repository, produce an implementation plan containing:

1. Current Architecture Analysis

Describe the relevant architecture that currently exists and identify the files/classes/modules involved.

Whenever possible, reference actual paths and class names from the repository.

2. Proposed Architecture

Show how the AI assistant integrates with the existing application.

Include a component diagram in Mermaid or another text-based diagram format.

3. Request Flow

Describe the complete lifecycle of a student request:

React
→ Backend
→ Authentication/authorization
→ Quota validation
→ Context retrieval
→ Input guardrails
→ Prompt construction
→ Spring AI
→ LLM
→ Output guardrails
→ Persistence
→ Response

4. Domain/Data Model Changes

Describe:

New AI interaction entity/entities.

Assignment changes.

Relationships.

Fields.

Indexes/constraints.

Database migrations.

5. Backend Changes

List the classes/packages that should be:

Created.

Modified.

Reused.

Explain the responsibility of each.

6. Frontend Changes

Describe required components, services/hooks, DTOs, state, and UI changes.

7. Spring AI Integration

Explain the recommended Spring AI integration based on the actual project dependencies and architecture.

8. Guardrail Strategy

Clearly separate:

Input validation.

Input guardrails.

Prompt instructions.

Output guardrails.

Deterministic application-level enforcement.

9. Quota Enforcement

Explain exactly how the per-student, per-assignment N request limit should be implemented safely, including concurrency considerations.

10. Persistence Strategy

Explain when and how AI interactions are persisted and how they relate to conversation history and quota calculation.

11. Security Considerations

Identify trust boundaries and relevant threats.

12. Testing Plan

Specify the tests required for each layer.

13. Implementation Phases

Break the implementation into small, logical phases that can be implemented and reviewed independently.

For each phase provide:

Goal.

Files/components affected.

Dependencies on previous phases.

Tests required.

Definition of done.

14. Open Questions

List every requirement or architectural decision that still requires clarification from me.

Decision-Making Rule

This rule is critical:

When something is unclear, ambiguous, or has multiple materially different architectural interpretations, ask me before choosing one.

Do not choose an arbitrary implementation just to complete the plan.

This applies especially to:

Quota semantics.

Conversation semantics.

Assistance-policy behavior.

Guardrail behavior.

What student information may be sent to the LLM.

What execution information may be exposed.

Persistence semantics.

Provider/model selection.

Failure handling.

Privacy/security decisions.

Prefer asking a focused question over making an unsupported assumption.

Engineering Principles

While preparing the plan:

Prefer consistency with the existing codebase over introducing unnecessary abstractions.

Avoid overengineering.

Do not introduce microservices unless there is a demonstrated need.

Do not introduce a vector database unless there is a demonstrated need.

Reuse existing domain services instead of bypassing them.

Keep infrastructure concerns out of the AI/domain orchestration layer.

Keep LLM-provider-specific details behind Spring AI abstractions.

Enforce security and quotas server-side.

Treat LLM output as untrusted.

Keep guardrails testable.

Make the architecture maintainable and extensible.

Clearly distinguish requirements discovered in the repository from recommendations you are making.

Most importantly, base the final plan on what actually exists in the repository, not only on this prompt.