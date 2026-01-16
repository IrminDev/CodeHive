# AGENTS.md - CodeHive Development Guide

## Project Overview

**CodeHive** is a collaborative educational platform that allows teachers to create groups with students who can deliver code by editing it directly from the platform. This is a full-stack monorepo with three main components:

- **codehive-backend**: Spring Boot 3.5.6 REST API (Java 21)
- **codehive-frontend**: React Router v7 SPA (TypeScript, React 19)
- **codehive-worker**: Spring Boot 4.0.1 worker service for sandboxed code execution (Java 21)

Current development focuses on authentication, user management, and the foundation for code execution infrastructure with RabbitMQ integration.

---

## Repository Structure

```
CodeHive/
├── codehive-backend/          # Main Spring Boot API
│   ├── src/main/java/com/github/codehive/
│   │   ├── config/           # Spring configuration (Security, OpenAPI, Cache, etc.)
│   │   ├── controller/       # REST controllers (Auth, RecoveryPassword)
│   │   ├── model/
│   │   │   ├── entity/       # JPA entities (User, PasswordResetToken)
│   │   │   ├── dto/          # Data Transfer Objects (UserDTO)
│   │   │   ├── request/      # Request POJOs organized by domain (auth/, recovery/)
│   │   │   ├── response/     # Response POJOs with inheritance hierarchy
│   │   │   ├── exception/    # Custom exceptions organized by domain
│   │   │   ├── enums/        # Enums (Role, Scope)
│   │   │   └── mapper/       # Entity <-> DTO mappers
│   │   ├── repository/       # JPA repositories
│   │   ├── service/          # Business logic layer
│   │   ├── security/         # JWT filter, UserDetailsService implementation
│   │   ├── ratelimit/        # Bucket4j-based rate limiting with AOP
│   │   └── utils/            # Utility classes (JwtUtil)
│   ├── src/test/java/        # Unit and integration tests (121 tests, 70%+ coverage)
│   ├── build.gradle.kts      # Gradle build configuration
│   ├── docker-compose.yaml   # PostgreSQL + RabbitMQ containers
│   └── .env                  # Environment variables (DB, JWT, Mail)
│
├── codehive-worker/          # Code execution worker service
│   ├── src/main/java/com/github/codehive/worker/
│   ├── build.gradle.kts      # Spring Boot 4.0.1, RabbitMQ, Docker Java client
│   └── settings.gradle.kts
│
├── codehive-frontend/        # React Router v7 frontend
│   ├── app/
│   │   ├── routes/           # Page routes (home, login, signup, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # API service classes (AuthService, RecoveryPasswordService)
│   │   ├── types/            # TypeScript types (request, response, model)
│   │   ├── context/          # React contexts (ThemeContext)
│   │   └── pages/            # Page components
│   ├── package.json          # npm scripts and dependencies
│   └── vite.config.ts        # Vite + React Router + Tailwind CSS
│
├── .github/workflows/        # CI/CD pipelines
│   └── backend-ci.yml        # Automated testing, coverage, build
└── PR_template.md            # Pull request template
```

---

## Essential Commands

### Backend (codehive-backend)

**Prerequisites:**
- Java 21
- Docker & Docker Compose (for PostgreSQL + RabbitMQ)

**Development:**
```bash
cd codehive-backend

# Start infrastructure (PostgreSQL + RabbitMQ)
docker-compose up -d

# Run the application (port 8080)
./gradlew bootRun

# Build
./gradlew build

# Build without tests
./gradlew build -x test
```

**Testing:**
```bash
# Run all tests (121 tests: 71 unit + 50 integration)
./gradlew test

# Run unit tests only
./gradlew test --tests "*Test" --exclude-tests "*IntegrationTest"

# Run integration tests only
./gradlew test --tests "*IntegrationTest"

# Generate coverage report (target: 70%+)
./gradlew test jacocoTestReport

# View coverage report
open build/reports/jacoco/test/html/index.html
```

**Database:**
```bash
# Docker containers defined in docker-compose.yaml
docker-compose up -d postgres    # PostgreSQL 18.1-alpine (port 5432)
docker-compose up -d rabbitmq    # RabbitMQ 4.2.2-management (ports 5672, 15672)
docker-compose down
```

**API Documentation:**
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

### Worker (codehive-worker)

**Development:**
```bash
cd codehive-worker

# Build
./gradlew build

# Run
./gradlew bootRun

# Test
./gradlew test
```

### Frontend (codehive-frontend)

**Prerequisites:**
- Node.js 18+

**Development:**
```bash
cd codehive-frontend

# Install dependencies
npm install

# Start dev server (port 3000 or 5173)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck
```

**Environment Variables:**
- Set `VITE_API_URL` in `.env` (defaults to http://localhost:8080)

---

## Code Patterns & Conventions

### Backend Java Patterns

#### Package Organization
- **Domain-based subpackages**: `model/request/auth/`, `model/exception/recovery/`
- **Consistent naming**: `{Action}Request`, `{Domain}Service`, `{Entity}Repository`
- **Clear separation**: Controllers → Services → Repositories → Entities

#### Request/Response Objects

**Requests** (`model/request/{domain}/`):
```java
// Pattern: {Action}Request in domain subfolder
// Example: model/request/auth/LoginRequest.java
public class LoginRequest {
    @NotBlank(message = "Email is required")
    private String identifier;
    
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    // No-arg constructor + parameterized constructor
    // Standard getters/setters
}
```

**Responses** (`model/response/`):
- **Base class**: `ApiResponse` (abstract, has `success` + `message`)
- **Generic wrapper**: `SuccessResponse<T>` with `data` field
- **Domain-specific**: `AuthResponse` in `response/auth/` subfolder
- **All use**: `@JsonInclude(JsonInclude.Include.NON_NULL)`

```java
// Example: model/response/SuccessResponse.java
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuccessResponse<T> extends ApiResponse {
    private final T data;
    
    public SuccessResponse(String message, T data) {
        super(true, message);
        this.data = data;
    }
}
```

#### Custom Exceptions

**Pattern**: Domain-organized exceptions extending `RuntimeException`
```java
// Location: model/exception/{domain}/{Description}Exception.java
// Example: model/exception/auth/IncorrectCredentialsException.java
public class IncorrectCredentialsException extends RuntimeException {
    // Always include 4 constructors:
    public IncorrectCredentialsException(String message) { super(message); }
    public IncorrectCredentialsException(String message, Throwable cause) { super(message, cause); }
    public IncorrectCredentialsException(Throwable cause) { super(cause); }
    public IncorrectCredentialsException() { super("The provided credentials are incorrect."); }
}
```

**Exception Handling**: `GlobalExceptionHandler` with `@RestControllerAdvice`
- **401**: Auth failures (`IncorrectCredentialsException`, `InvalidJWTException`)
- **404**: Not found (`EntityNotFoundException`, `TokenNotFoundException`)
- **409**: Conflicts (`AlreadyRegisteredEmailException`)
- **400**: Validation errors (`MethodArgumentNotValidException`)
- **429**: Rate limit exceeded (`RateLimitExceededException`)
- **500**: Generic runtime exceptions

#### Controllers

**Pattern**: REST controllers with OpenAPI annotations + rate limiting
```java
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication management APIs")
public class AuthController {
    private final AuthService authService;
    
    // Constructor injection (no @Autowired needed)
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    
    @Operation(summary = "User login", description = "Authenticate user...")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login successful",
            content = @Content(schema = @Schema(implementation = SuccessResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @RateLimit(limit = 5, duration = 60, message = "Too many login attempts. Please try again in 1 minute.")
    @PostMapping("/login")
    public ResponseEntity<SuccessResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(new SuccessResponse<>("Login successful", authResponse));
    }
}
```

#### Services

**Pattern**: Business logic with `@Service` and `@Transactional`
```java
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    // Constructor injection
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }
    
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Business logic
        // Throw custom exceptions on error
        // Return DTOs or response objects
    }
}
```

#### Repositories

**Pattern**: Spring Data JPA interfaces
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEnrollmentNumber(String enrollmentNumber);
}
```

#### Rate Limiting

**Implementation**: Annotation-based AOP with Bucket4j

1. **Annotation** (`ratelimit/RateLimit.java`):
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    int limit();        // Max requests
    int duration();     // Time window in seconds
    String message();   // Error message
}
```

2. **Usage on controllers**:
```java
@RateLimit(limit = 5, duration = 60, message = "Too many login attempts...")
@PostMapping("/login")
```

3. **Aspect intercepts** and checks `RateLimitService` (IP-based buckets)

#### Testing Conventions

**Unit Tests** (`*Test.java`):
- `@ExtendWith(MockitoExtension.class)`
- `@Mock` for dependencies, `@InjectMocks` for service under test
- Nested test classes with `@Nested` and `@DisplayName`
- AssertJ assertions: `assertThat(...).isEqualTo(...)`, `assertThatThrownBy(...)`

**Integration Tests** (`*IntegrationTest.java`):
- `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Transactional`
- `@ActiveProfiles("test")` (uses H2 in-memory database)
- `MockMvc` for HTTP testing
- Real database interactions with test data setup in `@BeforeEach`

**Test Structure**:
```java
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit")
class AuthServiceTest {
    @Mock private UserRepository userRepository;
    @InjectMocks private AuthService authService;
    
    @Nested
    @DisplayName("login()")
    class LoginTests {
        @Test
        @DisplayName("Returns AuthResponse for valid credentials")
        void login_WithValidCredentials_ReturnsAuthResponse() {
            // Given
            // When
            // Then
        }
    }
}
```

### Frontend TypeScript/React Patterns

#### Routing
- **React Router v7** with file-based routing in `app/routes/`
- Routes defined in `app/routes.ts`
- Pattern: `route("path", "routes/filename.tsx")`

#### Service Layer
```typescript
// Pattern: {Domain}Service class with methods returning Promises
// Example: services/AuthService.ts
class AuthServiceClass {
  private readonly baseUrl = `${API_BASE_URL}/api/auth`;

  async login(credentials: LoginRequest): Promise<SuccessResponse<AuthResponse>> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }
    return data;
  }
  
  // Token management methods
  setToken(token: string): void { localStorage.setItem("authToken", token); }
  getToken(): string | null { return localStorage.getItem("authToken"); }
  removeToken(): void { localStorage.removeItem("authToken"); }
}

export const AuthService = new AuthServiceClass();
```

#### Type Definitions
- **Request types**: `types/request/Auth.ts`
- **Response types**: `types/response/Api.ts`
- **Model types**: `types/model/User.ts`
- Mirror backend DTOs exactly

#### Component Organization
- **Pages**: `pages/{PageName}Page.tsx` (composed of components)
- **Components**: `components/{ComponentName}.tsx` (reusable)
- **Routes**: `routes/{route-name}.tsx` (route handlers that render pages)

#### Styling
- **Tailwind CSS v4** via `@tailwindcss/vite`
- Dark mode support via `ThemeContext`
- Utility-first classes

---

## Security & Authentication

### JWT Authentication Flow

1. **Login/Signup**: User submits credentials → Backend validates → Returns JWT token + user data
2. **Token Storage**: Frontend stores token in `localStorage` via `AuthService.setToken()`
3. **Protected Requests**: Frontend sends `Authorization: Bearer <token>` header
4. **Backend Validation**: `JWTAuthenticationFilter` intercepts, validates token, sets `SecurityContextHolder`

### JWT Configuration
- **Secret**: Stored in `.env` as `JWT_SECRET` (base64-encoded, min 256 bits)
- **Expiration**: `JWT_EXPIRATION_MS` (default: 86400000ms = 24 hours)
- **Claims**: `sub` (user email), `scope` (user scopes), `iat`/`exp` timestamps

### Security Configuration
- **CSRF**: Disabled (stateless JWT authentication)
- **CORS**: Configured for `FRONTEND_URL` from `.env`
- **Sessions**: Stateless (`.sessionManagement().sessionCreationPolicy(STATELESS)`)
- **Password Encoding**: BCrypt with strength 10

### Rate Limiting
- **Login**: 5 requests per 60 seconds per IP
- **Signup**: 3 requests per 5 minutes per IP
- **Forgot Password**: 3 requests per 5 minutes per IP
- **Reset Password**: 5 requests per 5 minutes per IP

---

## Environment Variables

### Backend `.env` (codehive-backend/)
```bash
# Database
DATABASE_NAME=codehive
DATABASE_USERNAME=myuser
DATABASE_PASSWORD=secret

# JWT
JWT_SECRET=<base64-encoded-secret-min-256-bits>
JWT_EXPIRATION_MS=86400000

# Mail (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_SMTP_AUTH=true
MAIL_STARTTLS_ENABLE=true

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` (codehive-frontend/)
```bash
VITE_API_URL=http://localhost:8080
```

---

## Database

### Technology
- **Production**: PostgreSQL 18.1-alpine
- **Testing**: H2 in-memory database (configured in `application-test.properties`)

### Entities

**User** (`model/entity/User.java`):
- `id` (Long, auto-generated)
- `name`, `lastName`, `enrollmentNumber` (unique), `email` (unique)
- `password` (BCrypt-encoded)
- `role` (enum: STUDENT, TEACHER, ADMIN)
- `scopes` (List<Scope>, many-to-many in `user_scopes` table)
- `profilePictureUrl`, `isActive`, `createdAt`
- Implements `UserDetails` for Spring Security

**PasswordResetToken** (`model/entity/PasswordResetToken.java`):
- `id`, `token` (UUID), `user` (ManyToOne), `expiryDate`, `used`

### Migration Strategy
- Currently: JPA auto-DDL (Hibernate `ddl-auto=update`)
- **TODO**: Migrate to Flyway/Liquibase for production

---

## API Endpoints

### Authentication (`/api/auth`)

#### `POST /api/auth/login`
**Rate Limit**: 5 req/60s  
**Request**:
```json
{
  "identifier": "user@example.com or ENR001",
  "password": "password123"
}
```
**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": 1,
      "name": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "enrollmentNumber": "ENR001",
      "role": "STUDENT",
      "scopes": ["READ", "WRITE"],
      "profilePictureUrl": "...",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00"
    }
  }
}
```

#### `POST /api/auth/signup`
**Rate Limit**: 3 req/5min  
**Request**:
```json
{
  "name": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "enrollmentNumber": "ENR002",
  "password": "password123",
  "role": "STUDENT"
}
```
**Response** (201): Same as login response

### Password Recovery (`/api/recovery-password`)

#### `POST /api/recovery-password/forgot`
**Rate Limit**: 3 req/5min  
**Request**:
```json
{
  "email": "user@example.com"
}
```
**Response** (200):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### `POST /api/recovery-password/reset`
**Rate Limit**: 5 req/5min  
**Request**:
```json
{
  "token": "uuid-token-from-email",
  "newPassword": "newpassword123"
}
```
**Response** (200):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## CI/CD

### GitHub Actions Workflow (`.github/workflows/backend-ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches (backend changes only)
- Pull requests to `main` or `develop`

**Pipeline Steps**:
1. **Setup**: Java 21 (Temurin), Gradle caching
2. **Test**: `./gradlew test --info` with `test` profile (H2 database)
3. **Coverage**: `./gradlew jacocoTestReport`
4. **Build**: `./gradlew build -x test` (creates JAR)
5. **Artifacts**: Upload test results, coverage reports, JAR
6. **PR Checks**: Publish test results, add coverage comment (min 70% overall, 80% changed files)

**Requirements for Passing**:
- All tests pass (121+ tests)
- No build errors
- Coverage thresholds met

---

## Testing Strategy

### Test Pyramid
- **70% Unit Tests**: Fast, isolated, mock dependencies
- **30% Integration Tests**: Slower, full Spring context, real database

### Coverage Targets
- **Overall**: 70%+ (enforced in CI)
- **Changed Files**: 80%+ (enforced in PR checks)
- **Current**: 70%+ (121 tests)

### Writing Tests

**For new features, always add**:
1. **Unit tests** for service layer logic
2. **Integration tests** for controller endpoints
3. **Edge cases**: null inputs, invalid data, error paths
4. **Security tests**: unauthorized access, rate limiting

**Test Naming**:
- Method: `methodName_Scenario_ExpectedOutcome`
- Display: `@DisplayName("Human-readable description")`

**Example**:
```java
@Test
@DisplayName("Throws IncorrectCredentialsException when password is wrong")
void login_WithWrongPassword_ThrowsIncorrectCredentialsException() {
    // Given
    LoginRequest request = new LoginRequest("user@example.com", "wrongpass");
    when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(testUser));
    when(passwordEncoder.matches("wrongpass", testUser.getPassword())).thenReturn(false);
    
    // When/Then
    assertThatThrownBy(() -> authService.login(request))
        .isInstanceOf(IncorrectCredentialsException.class)
        .hasMessage("Invalid credentials");
}
```

---

## Git Workflow

### Branch Naming
- **Feature**: `feature/{description}` or `feature/{jira-task-id}`
- **Bugfix**: `bugfix/{description}`
- **Hotfix**: `hotfix/{description}`

### Commit Messages
- Use conventional commits (optional but recommended)
- Examples: `feat: add user login`, `fix: resolve JWT expiration bug`, `test: add integration tests for signup`

### Pull Requests
- Use `PR_template.md` checklist
- **Required checks**:
  - [ ] All tests pass
  - [ ] Coverage thresholds met
  - [ ] Code follows style guidelines
  - [ ] Self-review completed
  - [ ] Documentation updated (if needed)

### Current Branch
- Active development on `feature/rabbitMQ` (integrating RabbitMQ for worker communication)

---

## Common Tasks

### Adding a New API Endpoint

1. **Define Request DTO** in `model/request/{domain}/{Action}Request.java`:
   - Add Jakarta validation annotations
   - No-arg + parameterized constructors
   - Getters/setters

2. **Define Response DTO** (if needed) in `model/response/{domain}/{Action}Response.java`:
   - Extend `ApiResponse` or use `SuccessResponse<T>`
   - Add `@JsonInclude(JsonInclude.Include.NON_NULL)`

3. **Create Custom Exceptions** in `model/exception/{domain}/{Error}Exception.java`:
   - Extend `RuntimeException`
   - Add 4 constructors

4. **Update GlobalExceptionHandler** in `model/exception/handler/GlobalExceptionHandler.java`:
   - Add `@ExceptionHandler` method for new exception
   - Return `ResponseEntity<ErrorResponse>` with appropriate HTTP status

5. **Implement Service Logic** in `service/{Domain}Service.java`:
   - `@Service` annotation
   - Constructor injection of dependencies
   - `@Transactional` on methods
   - Throw custom exceptions on errors

6. **Create Controller Endpoint** in `controller/{Domain}Controller.java`:
   - `@RestController` + `@RequestMapping("/api/{domain}")`
   - OpenAPI annotations (`@Operation`, `@ApiResponses`)
   - `@RateLimit` if needed
   - Call service method, return `ResponseEntity<SuccessResponse<T>>`

7. **Write Tests**:
   - Unit tests for service (`{Domain}ServiceTest.java`)
   - Integration tests for controller (`{Domain}ControllerIntegrationTest.java`)
   - Aim for 70%+ coverage

8. **Update API Documentation**:
   - OpenAPI annotations auto-generate Swagger docs
   - Test at http://localhost:8080/swagger-ui.html

### Adding a New Entity

1. **Create Entity** in `model/entity/{Entity}.java`:
   - `@Entity` + `@Table(name = "...")`
   - JPA annotations on fields
   - No-arg constructor + builder pattern (optional)

2. **Create Repository** in `repository/{Entity}Repository.java`:
   - Extend `JpaRepository<Entity, ID>`
   - Add custom query methods (Spring Data JPA naming)

3. **Create DTO** in `model/dto/{Entity}DTO.java`:
   - Fields for external representation
   - `@JsonInclude(JsonInclude.Include.NON_NULL)`

4. **Create Mapper** in `model/mapper/{Entity}Mapper.java`:
   - Static methods: `toDTO(Entity)`, `toEntity(DTO)`

5. **Update Database**:
   - Currently auto-DDL, no manual migration needed
   - For production, add Flyway/Liquibase migration

### Adding Frontend Page

1. **Create Route Handler** in `app/routes/{route-name}.tsx`:
   - Import page component
   - Export default component function

2. **Register Route** in `app/routes.ts`:
   - Add `route("path", "routes/{route-name}.tsx")`

3. **Create Page Component** in `app/pages/{PageName}Page.tsx`:
   - Use existing components from `app/components/`
   - Call service methods from `app/services/`

4. **Define Types** (if needed):
   - Request types in `app/types/request/`
   - Response types in `app/types/response/`
   - Model types in `app/types/model/`

5. **Add Service Method** in `app/services/{Domain}Service.ts`:
   - Follow existing pattern with `fetch` API
   - Handle errors with try/catch
   - Return typed promises

---

## Gotchas & Important Notes

### Backend

1. **Identifier in Login**: The `LoginRequest.identifier` field accepts **both** email and enrollment number. `AuthService.isEmail()` determines which to use.

2. **Rate Limiting by IP**: Rate limits are enforced per IP address (extracted from `X-Forwarded-For` or `RemoteAddr`). In development behind a proxy, all requests may share the same IP.

3. **Password Encoding**: Always use `passwordEncoder.encode()` before saving passwords. Never store plain text.

4. **Transaction Management**: Use `@Transactional` on service methods that modify data. Use `readOnly = true` for read-only operations (performance optimization).

5. **H2 Console in Tests**: Test profile uses H2 in-memory database. Data is reset between tests due to `@Transactional` on test classes.

6. **JWT Secret**: Must be at least 256 bits (32 bytes) base64-encoded. Generate with: `openssl rand -base64 32`

7. **Gradle Wrapper**: Always use `./gradlew` (Unix) or `gradlew.bat` (Windows), not system-installed Gradle, to ensure correct version.

8. **Docker Compose Integration**: Spring Boot DevTools auto-detects `docker-compose.yaml` and starts containers. Can be disabled by removing `spring-boot-docker-compose` dependency.

9. **Scope System**: Currently defined but not fully implemented. `User.scopes` is a placeholder for future fine-grained permissions.

10. **OpenAPI Documentation**: Always add `@Operation` and `@ApiResponses` to controller methods. Swagger UI auto-updates on application restart.

### Frontend

1. **API URL Configuration**: Set `VITE_API_URL` in `.env` for non-localhost backends. Defaults to `http://localhost:8080`.

2. **React Router v7**: Uses file-based routing. Routes must be registered in `routes.ts`, not auto-discovered.

3. **SSR Enabled**: Server-side rendering is enabled by default (`ssr: true` in `react-router.config.ts`). Can be disabled for pure SPA mode.

4. **Token Expiration**: Frontend doesn't automatically handle token expiration. Backend returns 401, but frontend needs to implement redirect to login.

5. **Dark Mode**: Managed by `ThemeContext`. Use `useTheme()` hook to access `theme` and `toggleTheme()`.

6. **Tailwind CSS v4**: Latest version with different configuration. Check official docs if migrating from v3.

### Testing

1. **Test Isolation**: Integration tests use `@Transactional` to rollback after each test. Don't rely on database state between tests.

2. **Mocking vs Real Beans**: Unit tests mock dependencies. Integration tests use real Spring beans (except external services like SMTP).

3. **Coverage Reports**: Generated in `build/reports/jacoco/test/html/index.html` after `./gradlew jacocoTestReport`.

4. **Flaky Tests**: Rate limiting tests may be flaky if system clock skews. Use `@DirtiesContext` if needed.

### Infrastructure

1. **RabbitMQ Integration**: Currently in development on `feature/rabbitMQ` branch. Worker service will consume code execution jobs from RabbitMQ queue.

2. **Docker Networking**: Backend, worker, PostgreSQL, and RabbitMQ communicate via Docker Compose network. Check `docker-compose.yaml` for service names.

3. **Port Conflicts**: Ensure ports 5432 (PostgreSQL), 5672/15672 (RabbitMQ), 8080 (backend), 3000/5173 (frontend) are available.

---

## Troubleshooting

### Backend Won't Start

**Issue**: `Connection refused` to PostgreSQL  
**Solution**: Ensure Docker containers are running: `docker-compose up -d`

**Issue**: `Invalid JWT_SECRET` error  
**Solution**: Check `.env` has valid base64-encoded secret (min 256 bits)

**Issue**: Tests fail with database errors  
**Solution**: Check `application-test.properties` is configured for H2, not PostgreSQL

### Frontend Can't Connect to Backend

**Issue**: CORS errors in browser console  
**Solution**: Check `FRONTEND_URL` in backend `.env` matches frontend dev server URL

**Issue**: 404 on API calls  
**Solution**: Verify `VITE_API_URL` in frontend `.env` is correct

### Tests Failing

**Issue**: Rate limit tests fail intermittently  
**Solution**: Add `Thread.sleep()` between requests or use `@DirtiesContext`

**Issue**: Integration tests fail with "table not found"  
**Solution**: Ensure `@ActiveProfiles("test")` is present on test class

### Coverage Below Threshold

**Issue**: CI fails with "Coverage below 70%"  
**Solution**: Add more unit tests for uncovered service methods. Focus on edge cases and error paths.

---

## Additional Resources

- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **React Router v7 Docs**: https://reactrouter.com/
- **Bucket4j (Rate Limiting)**: https://bucket4j.com/
- **Jacoco (Coverage)**: https://www.jacoco.org/jacoco/

---

## Future Enhancements

1. **Code Execution**: Complete worker service integration with sandboxed Docker containers
2. **Real-time Collaboration**: WebSocket support for live code editing
3. **Group Management**: Teacher/student group creation and assignment submission
4. **File Upload**: Support for uploading code files and project archives
5. **Flyway Migrations**: Replace JPA auto-DDL with versioned migrations
6. **Refresh Tokens**: Implement refresh token rotation for longer sessions
7. **Email Templates**: HTML email templates for password reset and notifications
8. **Admin Dashboard**: Frontend admin panel for user management
9. **API Versioning**: Add `/v1/` prefix to API routes for future compatibility
10. **Monitoring**: Add Actuator endpoints and Prometheus metrics

---

**Last Updated**: 2025-01-15  
**Current Branch**: `feature/rabbitMQ`  
**Project Status**: Active Development (Alpha)
