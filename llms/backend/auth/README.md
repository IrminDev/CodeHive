# Backend Auth Implementation

## Scope
This document explains the authentication and user registration behavior implemented in codehive-backend.

## Main Entry Points
- POST /api/auth/login
- POST /api/auth/signup
- POST /api/auth/signup/csv
- GET /api/auth/me

Controller: codehive-backend/src/main/java/com/github/codehive/controller/AuthController.java

## Login Flow
1. Request is validated through LoginRequest.
2. Identifier is interpreted as email or enrollment number.
3. User is loaded from UserRepository.
4. Password is verified with PasswordEncoder.
5. JWT is generated with claims (userId, role) and subject email.
6. Response returns AuthResponse inside SuccessResponse.

Service implementation: codehive-backend/src/main/java/com/github/codehive/service/AuthService.java

## Registration Flow (Admin Only)
1. Endpoint is protected with @PreAuthorize("hasAuthority('ADMIN')").
2. Request is validated through SignUpRequest.
3. Service checks duplicate email and enrollment number.
4. Temporary password is generated and encoded.
5. User is created with temporaryPassword=true and isActive=true.
6. Welcome email is sent with temporary credentials.

## Bulk Registration Flow (CSV)
1. Admin uploads CSV to /api/auth/signup/csv.
2. Controller validates file and creates taskId.
3. CsvRegistrationService.processAsync parses and validates rows.
4. Progress is streamed through WebSocket channel /ws/csv-progress.
5. Each valid row creates a user and sends welcome email.

Important validation rules:
- Exactly 6 columns expected per row.
- Role must be STUDENT, TEACHER, or ADMIN.
- Required fields cannot be empty.
- Email format must be valid.
- Duplicate email/enrollment is blocked both in-file and in-database.

## Current User (/me)
1. Controller reads Authorization header.
2. Bearer token is extracted.
3. AuthService resolves user from token subject.
4. UserDTO is returned.

## Data and Contracts
Request classes:
- model/request/auth/LoginRequest.java
- model/request/auth/SignUpRequest.java

Response classes:
- model/response/auth/AuthResponse.java
- model/response/SuccessResponse.java

User storage model:
- model/entity/User.java

## Error and Security Behavior
- Invalid credentials throw IncorrectCredentialsException.
- Duplicate email/enrollment throws conflict exceptions.
- Validation errors are handled by GlobalExceptionHandler.
- Endpoint rate limits are enforced via @RateLimit.

## Notes for Future Changes
- If role/permission model expands, update JWT claims and authorities mapping.
- Keep LoginRequest backward compatible because frontend and clients depend on identifier semantics.
- Bulk CSV should remain async to avoid request timeouts.
