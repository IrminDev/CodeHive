# Frontend Services Implementation

## Scope
This document describes API service modules used by the frontend.

Service files:
- app/services/AuthService.ts
- app/services/RecoveryPasswordService.ts
- app/services/index.ts

Base URL strategy:
- Uses VITE_API_URL when provided.
- Falls back to http://localhost:8080.

## AuthService
Base path:
- /api/auth

Implemented methods:
- login(credentials)
- signUp(userData)
- uploadCsv(file)
- getMe()
- getWebSocketUrl()
- setToken/getToken/removeToken/isAuthenticated/logout

Behavior details:
- signUp and uploadCsv include Authorization Bearer token.
- uploadCsv uses multipart/form-data.
- getMe validates token by calling /me.
- token storage is localStorage key authToken.
- websocket URL rewrites http(s) base to ws(s) and appends /ws/csv-progress.

## RecoveryPasswordService
Base path:
- /api/recovery-password

Implemented methods:
- forgotPassword(request)
- resetPassword(request)

Behavior details:
- Both methods post JSON payloads.
- Non-2xx responses throw Error with API message fallback.

## Type Contracts
Services consume and return typed contracts from app/types:
- request types (login/signup/forgot/reset)
- response wrappers (SuccessResponse, ErrorResponse)
- domain payloads (AuthResponse, MessageResponse, CsvTaskResponse, User)

## Error Handling Pattern
- Parse JSON response.
- If response not ok, throw Error using backend message/error fields.
- Let page or route components handle user-facing error display.

## Re-export Pattern
app/services/index.ts re-exports service singletons for concise imports:
- import { AuthService, RecoveryPasswordService } from ~/services

## Extension Guidance
- Keep one service class per backend API domain.
- Centralize token/header behavior in services, not components.
- Preserve response wrappers to maintain consistency across pages.
