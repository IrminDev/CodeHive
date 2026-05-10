# Backend Auth Implementation

## Scope
This document explains the authentication and user registration behavior implemented in codehive-backend.

## Main Entry Points
- POST /api/auth/login
- POST /api/auth/signup
- POST /api/auth/signup/csv
- GET /api/auth/me
- PUT /api/auth/me/password

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
1. Spring Security's `JWTAuthenticationFilter` runs before the controller and populates `SecurityContextHolder`.
2. Controller receives the already-authenticated `Authentication` object as a method argument.
3. `authentication.getName()` returns the subject email from the validated JWT.
4. `AuthService.getUserByEmail(email)` loads and returns the UserDTO.

Do NOT re-parse the `Authorization` header in controller methods — the `Authentication` injection already provides the verified identity.

## Update Password (/me/password)
1. Same `Authentication` injection as `/me` to identify the caller.
2. `UpdatePasswordRequest` carries `currentPassword` and `newPassword`.
3. `AuthService.updatePassword(userId, request)` verifies current password, encodes and persists new password, and sets `temporaryPassword = false`.

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

## AuthService Key Methods
- `login(LoginRequest)` — authenticate by email or enrollment number, return JWT + UserDTO
- `register(SignUpRequest)` — admin-only registration; generates temporary password and sends welcome email
- `getUserByEmail(String email)` — load UserDTO from email; used by controllers receiving `Authentication`
- `updatePassword(UUID userId, UpdatePasswordRequest)` — verify current password and persist new one
- `generateToken(User)` — build JWT with `userId` and `role` claims, `email` as subject

## Notes for Future Changes
- If role/permission model expands, update JWT claims and authorities mapping.
- Keep LoginRequest backward compatible because frontend and clients depend on identifier semantics.
- Bulk CSV should remain async to avoid request timeouts.
