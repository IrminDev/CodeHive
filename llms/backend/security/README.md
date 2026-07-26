# Backend Security Implementation

## Scope
This document describes authentication, authorization, and filter-chain behavior in codehive-backend.

Primary classes:
- config/SecurityConfig.java
- security/JWTAuthenticationFilter.java
- security/UserDetailsServiceImplementation.java
- utils/JwtUtil.java

## Security Model
- Stateless authentication with JWT bearer tokens.
- User principal loaded from users table via UserDetailsService.
- Role- and scope-based authorization via authorities derived from `Role` and `Scope`.
- `SUPER_ADMIN` expands to every scope at authentication time; JWTs do not cache scopes.
- Method-level authorization enabled with @EnableMethodSecurity.

## Filter Chain Behavior
JWTAuthenticationFilter executes once per request:
1. Reads Authorization header.
2. Verifies Bearer token prefix.
3. Extracts subject (email) from token.
4. Loads user details from repository.
5. Validates token signature and expiration.
6. Rejects disabled users even when their existing JWT is otherwise valid.
7. Populates SecurityContext if valid.

Invalid or missing token behavior:
- Filter does not authenticate and request continues.
- Access depends on endpoint permitAll/authenticated rules.

## Authorization Rules
Configured in SecurityConfig:
- Permit all:
  - POST /api/auth/login
  - POST /api/recovery-password/**
  - /ws/**
  - Swagger endpoints
- All other routes (including `/api/execution/**`) require authentication via `anyRequest().authenticated()`.

Method-level restrictions:
- Admin management requires the `ADMIN` role plus the relevant user-management scope.
- `CREATE_GROUP` controls group creation independently of role.
- Regular admins cannot manage themselves or superadmins and can delegate only explicitly held scopes.

User-management scopes:
- `VIEW_USERS`, `CREATE_USERS`, `UPDATE_USERS`, `MANAGE_USER_STATUS`
- `CREATE_ADMINS`, `UPDATE_ADMINS`, `MANAGE_ADMIN_STATUS`
- `MANAGE_SCOPES`, `SUPER_ADMIN`

The former aggregate user-management scope has been removed. New development
data must use the four explicit non-admin scopes; no runtime compatibility
alias or data backfill is retained.

## Password and Identity Handling
- Password hashing: BCryptPasswordEncoder.
- UserDetails identity key: email.
- Locked/disabled semantics depend on User.isActive.

## CORS and Session
- CORS currently allows all origins through allowed origin pattern.
- Session creation policy is STATELESS.
- CSRF is disabled for API style usage.

## Related Error Handling
Security-related exceptions are translated by GlobalExceptionHandler:
- InvalidJWTException / ExpiredJWTException -> 401
- AccessDeniedException -> 403

## Hardening Notes
- CORS allow-all is convenient for development but should be narrowed for production.
- Keep JWT secret/expiration in environment configuration and rotate when required.

## Controller Identity Pattern
Controllers that need the authenticated user's identity must inject `Authentication` as a parameter — never re-parse the `Authorization` header manually. The filter already validated and stored the principal in `SecurityContextHolder` before the controller is invoked.

```java
@GetMapping("/me")
public ResponseEntity<?> me(Authentication authentication) {
    UserDTO user = authService.getUserByEmail(authentication.getName());
    ...
}
```
