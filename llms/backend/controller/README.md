# Backend Controller Layer

## Scope
This document describes how HTTP controllers are implemented and how requests flow to services.

Controller classes:
- codehive-backend/src/main/java/com/github/codehive/controller/AuthController.java
- codehive-backend/src/main/java/com/github/codehive/controller/RecoveryPasswordController.java
- codehive-backend/src/main/java/com/github/codehive/controller/CheckExecutionController.java

## Controller Responsibilities
- Define API routes and HTTP semantics.
- Validate request payloads with @Valid.
- Apply endpoint-level limits via @RateLimit.
- Enforce authorization with @PreAuthorize where needed.
- Return a consistent wrapper response (SuccessResponse/ErrorResponse).
- Delegate business logic to service classes.

## Response Pattern
Success responses typically use:
- SuccessResponse<T> for data payloads.

Error handling is centralized in:
- model/exception/handler/GlobalExceptionHandler.java

## Endpoint Group Behavior
AuthController:
- Login, signup, current user, CSV bulk signup.
- Signup routes require admin authority.

RecoveryPasswordController:
- Forgot password and reset password flows.
- Returns generic success messages to avoid account enumeration.

CheckExecutionController:
- POST /api/execution/check creates execution and queues worker job.
- GET /api/execution/check/{id} polls execution status.

## Cross-Cutting Concerns
- OpenAPI annotations are used for API docs.
- Rate limiting is applied through custom annotation and aspect.
- Security is primarily in filters/config, not in controllers.

## Implementation Conventions
- Keep controllers thin and orchestration-only.
- Do not embed repository logic in controllers.
- Prefer explicit HTTP status codes (200, 201, 202, etc).
- Keep route grouping by domain under /api/{domain}.

## Adding a New Controller
1. Create class under controller package.
2. Define request/response DTOs under model/request and model/response.
3. Add service method and keep business logic there.
4. Add @RateLimit if endpoint can be abused.
5. Add method security annotations when role-restricted.
6. Document endpoint with OpenAPI annotations.
