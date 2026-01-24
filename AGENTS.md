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
│   │   ├── config/           # Spring configuration (Security, OpenAPI, Cache, RabbitMQ)
│   │   ├── controller/       # REST controllers (Auth, RecoveryPassword)
│   │   ├── messaging/
│   │   │   └── listener/     # RabbitMQ message listeners (ExecutionResultListener)
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
│   │   ├── config/           # RabbitMQ, Docker, and MinIO configuration
│   │   ├── messaging/
│   │   │   ├── listener/     # RabbitMQ message listeners (SubmissionListener)
│   │   │   └── producer/     # RabbitMQ message producers (ExecutionResultProducer)
│   │   ├── model/
│   │   │   ├── dto/queue/    # ExecutionJob DTO
│   │   │   └── enums/        # Language, ExecutionStatus, ExecutionType, ComparatorType
│   │   ├── sandbox/          # Code execution in isolated Docker containers
│   │   │   ├── java/         # JavaExecutor for Java code
│   │   │   ├── python/       # PythonExecutor for Python code
│   │   │   ├── c/            # CExecutor for C code
│   │   │   ├── cpp/          # CPPExecutor for C++ code
│   │   │   ├── factory/      # LanguageExecutorFactory for strategy pattern
│   │   │   ├── ExecutionResult.java
│   │   │   └── LanguageExecutor.java (interface)
│   │   ├── service/          # ObjectStorageService for MinIO
│   │   └── util/             # Utility classes (ObjectKeyBuilder, TimeoutUtils)
│   ├── src/test/java/        # Tests with Testcontainers configuration
│   ├── build.gradle.kts      # Spring Boot 4.0.1, RabbitMQ, Docker Java client, MinIO
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

**Prerequisites:**
- Java 21
- Docker (for executing code in isolated containers)
- RabbitMQ running (via backend's docker-compose)

**Development:**
```bash
cd codehive-worker

# Build
./gradlew build

# Run (connects to RabbitMQ on localhost:5672)
./gradlew bootRun

# Test
./gradlew test
```

**Architecture:**
- Listens to RabbitMQ queues for code submission messages
- Executes code in isolated Docker containers per language
- Supports Java, Python, C, and C++
- Uses Docker Java API for container management
- Enforces execution timeouts and resource limits

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

#### RabbitMQ Messaging

**Backend RabbitMQ Configuration** (`config/RabbitConfig.java`):
```java
@Configuration
public class RabbitConfig {
    public static final String QUEUE_NAME = "codehive_queue";           // For sending jobs to worker
    public static final String RESULT_QUEUE_NAME = "codehive_result_queue";  // For receiving results

    @Bean
    Queue executionQueue() { return new Queue(QUEUE_NAME, true); }

    @Bean
    Queue resultQueue() { return new Queue(RESULT_QUEUE_NAME, true); }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

**Execution Result Listener** (`messaging/listener/ExecutionResultListener.java`):
```java
@Component
public class ExecutionResultListener {
    private final ExecutionResultService executionResultService;

    @RabbitListener(queues = "${rabbitmq.result.queue:codehive_result_queue}")
    public void handleExecutionResult(ExecutionReport report) {
        logger.info("Received execution result: executionId={}, status={}", 
            report.getExecutionId(), report.getOverallStatus());
        executionResultService.processExecutionResult(report);
    }
}
```

**Execution Result Service** (`service/ExecutionResultService.java`):
```java
@Service
public class ExecutionResultService {
    private final ExecutionRepository executionRepository;

    @Transactional
    public void processExecutionResult(ExecutionReport report) {
        Execution execution = executionRepository.findById(report.getExecutionId())
            .orElse(null);
        
        if (execution == null) {
            logger.warn("Execution not found: id={}", report.getExecutionId());
            return;
        }

        execution.setStatus(report.getOverallStatus());
        execution.setTimeMs(report.getMaxExecutionTimeMs());
        execution.setMemoryMb(report.getMaxMemoryUsedKb() / 1024);  // KB to MB
        
        executionRepository.save(execution);
    }
}
```

**Queue DTOs** (`model/dto/queue/`):
- `ExecutionJob.java`: Sent to worker (source path, language, test config, limits)
- `ExecutionReport.java`: Received from worker (status, test results, statistics)
- `TestCaseResult.java`: Individual test case result (status, time, memory, feedback)

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

### Worker Java Patterns

#### Package Organization
- **config/**: Spring configuration beans (RabbitMQ, Docker client, MinIO)
- **messaging/**: RabbitMQ message handling
  - **listener/**: `@RabbitListener` components (SubmissionListener)
  - **producer/**: Message producers (ExecutionResultProducer)
- **model/**: Data models
  - **dto/**: DTOs (ExecutionReport, TestCaseResult)
  - **dto/queue/**: Message DTOs (ExecutionJob)
  - **enums/**: Enums (Language, ExecutionStatus, ExecutionType, ComparatorType)
- **sandbox/**: Code execution in Docker containers
  - **{language}/**: Language-specific executor implementations (java, python, c, cpp)
  - **factory/**: `LanguageExecutorFactory` for strategy pattern
  - Core interfaces and result models
- **service/**: Business logic (ObjectStorageService for MinIO)
- **util/**: Utility classes (ObjectKeyBuilder, TimeoutUtils)

#### Language Executor Pattern

**Interface** (`sandbox/LanguageExecutor.java`):
```java
public interface LanguageExecutor {
    /**
     * Execute code with given constraints
     * @param sourceCode The source code input stream from MinIO
     * @param testInput The test input stream from MinIO (can be null)
     * @param timeLimitMs Time limit in milliseconds
     * @param memoryLimitMb Memory limit in megabytes
     * @return ExecutionResult with verdict and execution details
     */
    ExecutionResult execute(InputStream sourceCode, InputStream testInput, 
                           Long timeLimitMs, Long memoryLimitMb) throws Exception;
}
```

**Implementation** (e.g., `sandbox/java/JavaExecutor.java`):
```java
@Component("JAVA")  // Bean name matches Language enum
public class JavaExecutor implements LanguageExecutor {
    private final DockerClient dockerClient;
    private static final String JAVA_IMAGE = "openjdk:21-slim";
    
    @Override
    public ExecutionResult execute(InputStream sourceCode, InputStream testInput, 
                                   Long timeLimitMs, Long memoryLimitMb) {
        // 1. Create temp directory and save source/input files
        // 2. Compile in Docker container (separate from execution)
        // 3. Execute in isolated container with resource limits
        // 4. Monitor for TLE, MLE, RTE, CE
        // 5. Capture output and cleanup
        // 6. Return ExecutionResult with status (TLE/MLE/RTE/CE/AC)
    }
}
```

**Supported Languages**:
- **Java**: `@Component("JAVA")` - JavaExecutor (openjdk:21-slim)
- **Python**: `@Component("PYTHON")` - PythonExecutor (python:3.11-slim)
- **C**: `@Component("C")` - CExecutor (gcc:latest)
- **C++**: `@Component("CPP")` - CPPExecutor (gcc:latest with g++)

**Factory Pattern** (`sandbox/factory/LanguageExecutorFactory.java`):
```java
@Component
public class LanguageExecutorFactory {
    private final Map<String, LanguageExecutor> executors;
    
    // Spring injects all LanguageExecutor beans by bean name
    public LanguageExecutorFactory(Map<String, LanguageExecutor> executors) {
        this.executors = executors;
    }
    
    public LanguageExecutor getExecutor(Language language) {
        return executors.get(language.name());  // "JAVA", "PYTHON", "C", "CPP"
    }
}
```

**Execution Result**:
```java
public class ExecutionResult {
    private ExecutionStatus status;  // TLE, MLE, RTE, CE, WA, AC (enum)
    private String output;           // stdout
    private String errorOutput;      // stderr
    private Long executionTimeMs;    // Execution time
    private Long memoryUsedKb;       // Memory used (best effort)
    private Integer exitCode;        // Process exit code
    private String compilationError; // Compilation errors
    
    // Factory methods: compilationError(), runtimeError(), 
    //                  timeLimitExceeded(), memoryLimitExceeded(), success()
}
```

**Verdict Detection**:
- **CE (Compilation Error)**: Non-zero exit code during compilation phase
- **TLE (Time Limit Exceeded)**: Execution exceeds `timeLimitMs` (detected via Future timeout)
- **MLE (Memory Limit Exceeded)**: Container killed by Docker (exit code 137)
- **RTE (Runtime Error)**: Non-zero exit code during execution
- **AC (Accepted)**: Exit code 0 with successful execution (TODO: output comparison for AC/WA)

#### Messaging Pattern

**Message DTO** (`model/dto/queue/ExecutionJob.java`):
```java
public class ExecutionJob {
    private Long id;                          // Execution ID
    private String source;                    // MinIO path to source code
    private String reference;                 // MinIO path to reference solution
    private Language language;                // Student code language: JAVA, PYTHON, C, CPP
    private Language referenceLanguage;       // Reference solution language
    private ExecutionType executionType;      // PRACTICE or DEFINITIVE
    private List<String> testCases;           // Inline test inputs (PRACTICE mode)
    private String outputPath;                // MinIO path to store execution report JSON
    private Long timeLimitMs;                 // Time limit in milliseconds
    private Long memoryLimitMb;               // Memory limit in megabytes
    private Integer numTests;                 // Number of test cases (DEFINITIVE mode)
    private String testsPath;                 // Base path for test files (DEFINITIVE mode)
    private ComparatorType comparatorType;    // EXACT_MATCH or FLOATING_POINT
}
```

**MinIO Path Structure**:
- **Test inputs**: `test-suites/assignments/{assignment-id}/tc-{tc-id}/tc-{tc-id}.in`
- **Expected outputs**: `test-suites/assignments/{assignment-id}/tc-{tc-id}/tc-{tc-id}.out`
- **Submissions**: `submissions/groups/{group-id}/assignments/{assignment-id}/submission-{submission-id}/Main.{ext}`
- **Practice executions**: `test-execution/execution-{id}/Main.{ext}`

**Execution Types**:
- **DEFINITIVE**: Run against stored test cases (1 to numTests) from `testsPath`, compare with `.out` files
- **PRACTICE**: Run against inline test cases, compare with reference solution output

**Listener** (`messaging/listener/SubmissionListener.java`):
```java
@Component
public class SubmissionListener {
    private final TestExecutionService testExecutionService;
    private final ExecutionResultProducer executionResultProducer;
    
    @RabbitListener(queues = "${rabbitmq.queue:codehive_queue}")
    public void handleExecutionJob(ExecutionJob job) {
        // Execute all test cases and generate comprehensive report
        ExecutionReport report = testExecutionService.executeJob(job);
        
        // Report contains:
        // - Overall status (AC/WA/TLE/MLE/RTE/CE)
        // - Individual test case results
        // - Execution statistics
        // - Stored in MinIO at job.getOutputPath()
        
        logger.info("Execution completed: id={}, status={}, passed={}/{}", 
            job.getId(), report.getOverallStatus(), 
            report.getPassedTests(), report.getTotalTests());
        
        // Send result back to backend via RabbitMQ result queue
        executionResultProducer.sendExecutionResult(report);
    }
}
```

**Producer** (`messaging/producer/ExecutionResultProducer.java`):
```java
@Service
public class ExecutionResultProducer {
    private final RabbitTemplate rabbitTemplate;

    public void sendExecutionResult(ExecutionReport report) {
        logger.info("Sending execution result: executionId={}, status={}", 
            report.getExecutionId(), report.getOverallStatus());
        
        rabbitTemplate.convertAndSend(RabbitMQConfig.RESULT_QUEUE_NAME, report);
    }
}
```

**Test Execution Service** (`service/TestExecutionService.java`):
The service orchestrates test execution based on execution type:

1. **DEFINITIVE Mode**:
   - Downloads source code from `job.getSource()`
   - For each test case (1 to `job.getNumTests()`):
     - Downloads input from `{testsPath}/tc-{i}/tc-{i}.in`
     - Downloads expected output from `{testsPath}/tc-{i}/tc-{i}.out`
     - Executes student code with test input
     - Compares output using `OutputComparatorService`
     - Records result (AC/WA/TLE/MLE/RTE)

2. **PRACTICE Mode**:
   - Downloads student source from `job.getSource()`
   - Downloads reference solution from `job.getReference()`
   - For each inline test case in `job.getTestCases()`:
     - Executes reference solution to get expected output
     - Executes student code with same input
     - Compares outputs using `OutputComparatorService`
     - Records result (AC/WA/TLE/MLE/RTE)

3. **Output Comparison** (`service/OutputComparatorService.java`):
   - **EXACT_MATCH**: Trimmed line-by-line comparison
   - **FLOATING_POINT**: Token-by-token with epsilon tolerance (1e-9)

4. **Report Generation** (`model/dto/ExecutionReport.java`):
   - Overall status (worst-case verdict)
   - Per-test-case results with timing/memory
   - Statistics: passed/failed counts, max time/memory
   - Uploaded to MinIO as JSON at `job.getOutputPath()`

**Configuration** (`config/RabbitMQConfig.java`):
```java
@Configuration
public class RabbitMQConfig {
    public static final String QUEUE_NAME = System.getProperty("rabbitmq.queue", "codehive_queue");
    public static final String RESULT_QUEUE_NAME = System.getProperty("rabbitmq.result.queue", "codehive_result_queue");
    
    @Bean
    Queue executionQueue() {
        return new Queue(QUEUE_NAME, true);  // Durable queue
    }

    @Bean
    Queue resultQueue() {
        return new Queue(RESULT_QUEUE_NAME, true);  // Durable queue for results
    }
    
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();  // JSON serialization
    }
}
```

**MinIO Integration** (`service/ObjectStorageService.java`):
```java
@Service
public class ObjectStorageService {
    private final MinioClient minioClient;
    private final String bucketName = System.getProperty("minio.bucketName", "codehive");
    
    public InputStream download(String objectKey) throws Exception {
        return minioClient.getObject(
            GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build()
        );
    }
    
    public void upload(String objectKey, String content) throws Exception {
        byte[] contentBytes = content.getBytes(StandardCharsets.UTF_8);
        ByteArrayInputStream stream = new ByteArrayInputStream(contentBytes);
        
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .stream(stream, contentBytes.length, -1)
                .contentType("text/plain")
                .build()
        );
    }
}
```

#### Sandbox Execution Flow

1. **Message arrives** → `SubmissionListener` receives `ExecutionJob` from RabbitMQ queue (`codehive_queue`)
2. **Download files** → `ObjectStorageService` downloads source code and test input from MinIO
3. **Factory dispatch** → `LanguageExecutorFactory.getExecutor(language)` returns appropriate executor
4. **Temp file creation** → Executor creates temp directory and saves source/input files
5. **Compilation** (if needed) → Separate Docker container compiles code (Java, C, C++)
   - Exit code != 0 → Return CE (Compilation Error)
6. **Container creation** → Executor creates isolated Docker container with:
   - Language-specific image (openjdk, python, gcc)
   - Memory limit (`--memory`, `--memory-swap`)
   - CPU limit (`--cpu-quota`)
   - Network isolation (`--network=none`)
   - Volume mount for source/input files
7. **Code execution** → Run code with timeout monitoring via `Future.get(timeout)`
   - Timeout → Return TLE (Time Limit Exceeded)
   - Exit code 137 → Return MLE (Memory Limit Exceeded)
   - Exit code != 0 → Return RTE (Runtime Error)
   - Exit code 0 → Return AC (Accepted) or WA (Wrong Answer, TODO)
8. **Result collection** → Capture stdout, stderr, exit code, execution time
9. **Cleanup** → Remove Docker container, delete temp files
10. **Result publishing** → `ExecutionResultProducer` sends `ExecutionReport` to `codehive_result_queue`
11. **Backend processing** → `ExecutionResultListener` receives report, `ExecutionResultService` updates `Execution` entity

**Docker Images**:
- Java: `openjdk:21-slim` (compilation: `javac`, execution: `java`)
- Python: `python:3.11-slim` (execution: `python`, syntax errors detected as CE)
- C: `gcc:latest` (compilation: `gcc -o program main.c -lm`, execution: `./program`)
- C++: `gcc:latest` (compilation: `g++ -o program main.cpp -std=c++17 -lm`, execution: `./program`)

**Resource Limits**:
- Default time limit: 5000ms (5 seconds)
- Default memory limit: 256MB
- CPU limit: 1 CPU (100000 quota)
- Network: Disabled (`--network=none`)
- Compilation memory: 512MB (fixed)

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

### Adding a New Language Executor to Worker

1. **Create Executor Class** in `sandbox/{language}/{Language}Executor.java`:
   ```java
   @Component("languagename")  // Bean name must match language identifier
   public class LanguageExecutor implements LanguageExecutor {
       // Implement execution logic
   }
   ```

2. **Implement Execution Logic**:
   - Create Docker container with appropriate image (e.g., `openjdk:21`, `python:3.11`, `gcc:latest`)
   - Mount code as volume or write to container filesystem
   - Set resource limits (CPU, memory, network: none)
   - Execute with timeout (use Resilience4j TimeLimiter)
   - Capture stdout, stderr, exit code
   - Clean up container (`docker rm -f`)

3. **Add Dependencies** (if needed):
   - Update `build.gradle.kts` with language-specific libraries
   - Add Docker image pull logic in executor constructor

4. **Test Execution**:
   - Create test class in `src/test/java/`
   - Use Testcontainers to verify Docker execution
   - Test edge cases: infinite loops, memory leaks, compilation errors

5. **Factory Auto-Discovery**:
   - No changes needed - `LanguageExecutorFactory` auto-discovers by bean name
   - Verify: `factory.getExecutor("languagename")` returns your executor

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

### Worker

1. **Docker Daemon Required**: Worker service requires Docker daemon running on the host. Ensure Docker socket is accessible (`/var/run/docker.sock` on Unix).

2. **Language Bean Names**: Executor bean names (`@Component("java")`) **must** match the language identifiers used in `SubmissionMessage`. Case-sensitive.

3. **Container Cleanup**: Always clean up Docker containers after execution, even on errors. Use try-finally or `@PreDestroy` hooks.

4. **Execution Timeouts**: Implement timeouts using Resilience4j `TimeLimiter` (already in dependencies). Default should be 10-30 seconds per execution.

5. **Resource Limits**: Set Docker container resource limits: `--memory=512m`, `--cpus=1.0`, `--network=none` for security.

6. **Image Availability**: Worker assumes Docker images are pre-pulled. Add image pull logic in executor constructors or startup to avoid delays.

7. **RabbitMQ Connection**: Worker connects to RabbitMQ on localhost:5672 by default. Configure via `spring.rabbitmq.*` properties if different.

8. **Message Acknowledgement**: Use manual acknowledgement for RabbitMQ messages. Only ack after successful execution and result publishing.

9. **Testcontainers**: Worker tests use Testcontainers (see `TestcontainersConfiguration.java`). Requires Docker for running tests.

10. **Security Isolation**: Never trust user code. Containers must run with `--network=none`, read-only filesystem where possible, and no privileged access.

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

1. **RabbitMQ Integration**: ✅ **FULLY IMPLEMENTED** - Bidirectional communication between backend and worker:
   - Backend sends `ExecutionJob` to `codehive_queue` via `ExecutionProducer`
   - Worker processes jobs and sends `ExecutionReport` to `codehive_result_queue` via `ExecutionResultProducer`
   - Backend receives results via `ExecutionResultListener` and updates `Execution` entity via `ExecutionResultService`

2. **MinIO Integration**: ✅ **IMPLEMENTED** - Backend and worker use MinIO for object storage. Source code and test inputs are stored as files in MinIO bucket (`codehive`), referenced by object keys in `ExecutionJob`.

3. **Docker Networking**: Backend, worker, PostgreSQL, RabbitMQ, and MinIO communicate via Docker Compose network. Worker accesses host Docker daemon via socket mount (`/var/run/docker.sock`) to create isolated execution containers.

4. **Port Conflicts**: Ensure ports are available:
   - 5432: PostgreSQL
   - 5672/15672: RabbitMQ (AMQP/Management UI)
   - 9000/9001: MinIO (API/Console)
   - 8080: Backend API
   - 3000/5173: Frontend dev server

5. **Worker Deployment**: In production, worker should run on separate machines with Docker installed. Use Docker-in-Docker or bind mount Docker socket with caution (security implications). Ensure MinIO and RabbitMQ are accessible from worker.

6. **Language Executors**: ✅ **IMPLEMENTED** - All four language executors (Java, Python, C, C++) are fully implemented with:
   - Docker-based sandboxing
   - Resource limits (memory, CPU, network isolation)
   - Timeout detection (TLE)
   - Memory limit detection (MLE)
   - Compilation error detection (CE)
   - Runtime error detection (RTE)
   - Output comparison for AC/WA verification (EXACT_MATCH and FLOATING_POINT modes)

7. **Test Execution Pipeline**: ✅ **IMPLEMENTED** - Complete orchestration of test case execution:
   - DEFINITIVE mode: Batch execution against stored test cases from MinIO
   - PRACTICE mode: Dynamic execution against inline test cases with reference solution comparison
   - Per-test-case result tracking with detailed feedback
   - Comprehensive execution reports with statistics (passed/failed, timing, memory)
   - JSON report upload to MinIO for backend consumption

8. **Result Publishing Pipeline**: ✅ **IMPLEMENTED** - Complete result flow from worker to backend:
   - Worker's `ExecutionResultProducer` publishes `ExecutionReport` to `codehive_result_queue`
   - Backend's `ExecutionResultListener` consumes results from the queue
   - `ExecutionResultService` updates `Execution` entity with status, timing, and memory stats
   - Handles error cases by sending error reports back to backend

---

## Troubleshooting

### Backend Won't Start

**Issue**: `Connection refused` to PostgreSQL  
**Solution**: Ensure Docker containers are running: `docker-compose up -d`

**Issue**: `Invalid JWT_SECRET` error  
**Solution**: Check `.env` has valid base64-encoded secret (min 256 bits)

**Issue**: Tests fail with database errors  
**Solution**: Check `application-test.properties` is configured for H2, not PostgreSQL

### Worker Won't Start

**Issue**: `Cannot connect to Docker daemon`  
**Solution**: Ensure Docker daemon is running: `docker info` or `systemctl start docker`

**Issue**: `Connection refused` to RabbitMQ  
**Solution**: Start RabbitMQ via backend's `docker-compose up -d rabbitmq`

**Issue**: Container creation fails  
**Solution**: Pull required images manually: `docker pull openjdk:21-slim`, `docker pull python:3.11-slim`, `docker pull gcc:latest`

**Issue**: Tests fail with Testcontainers errors  
**Solution**: Ensure Docker is accessible for tests. Check Docker socket permissions.

**Issue**: MinIO connection errors  
**Solution**: Ensure MinIO is running and accessible. Check `minio.url`, `minio.accessKey`, `minio.secretKey` in environment variables or system properties.

**Issue**: Execution jobs not being consumed  
**Solution**: Check RabbitMQ queue name matches between backend and worker (`codehive_queue`). Verify worker is connected to RabbitMQ via management UI (http://localhost:15672).

**Issue**: Language executor not found  
**Solution**: Verify bean names match enum values: `@Component("JAVA")`, `@Component("PYTHON")`, `@Component("C")`, `@Component("CPP")` (all uppercase).

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
- **Spring AMQP (RabbitMQ)**: https://spring.io/projects/spring-amqp
- **Docker Java Client**: https://github.com/docker-java/docker-java
- **MinIO Java SDK**: https://min.io/docs/minio/linux/developers/java/minio-java.html
- **React Router v7 Docs**: https://reactrouter.com/
- **Bucket4j (Rate Limiting)**: https://bucket4j.com/
- **Jacoco (Coverage)**: https://www.jacoco.org/jacoco/
- **Testcontainers**: https://testcontainers.com/
- **RabbitMQ Docs**: https://www.rabbitmq.com/documentation.html

---

## Future Enhancements

1. ~~**Result Publishing**~~: ✅ **COMPLETED** - Bidirectional RabbitMQ communication implemented
2. **Real-time Collaboration**: WebSocket support for live code editing
3. **Group Management**: Teacher/student group creation and assignment submission
4. **File Upload**: Support for uploading code files and project archives
5. **Flyway Migrations**: Replace JPA auto-DDL with versioned migrations
6. **Refresh Tokens**: Implement refresh token rotation for longer sessions
7. **Email Templates**: HTML email templates for password reset and notifications
8. **Admin Dashboard**: Frontend admin panel for user management
9. **API Versioning**: Add `/v1/` prefix to API routes for future compatibility
10. **Monitoring**: Add Actuator endpoints and Prometheus metrics for worker execution metrics
11. **Multi-file Support**: Worker support for projects with multiple source files and complex build systems
12. **Language Extensions**: Add support for Go, Rust, JavaScript, TypeScript, Ruby
13. **Execution History**: Store and display past code execution results with analytics
14. **Security Hardening**: Add seccomp profiles, AppArmor/SELinux policies for worker containers
15. **Horizontal Scaling**: Support multiple worker instances with load balancing

---

**Last Updated**: 2026-01-22  
**Current Branch**: `feature/rabbitMQ`  
**Project Status**: Active Development (Alpha)  
**Worker Status**: ✅ **FULLY OPERATIONAL** - Complete bidirectional communication pipeline:
- RabbitMQ integration with comprehensive `ExecutionJob` model
- MinIO integration for source code, test cases, and execution reports
- All 4 language executors (Java, Python, C, C++) with Docker sandboxing
- DEFINITIVE mode: Multi-test execution with stored test cases
- PRACTICE mode: Reference solution comparison
- Output comparison service with EXACT_MATCH and FLOATING_POINT modes
- Comprehensive execution reports with per-test-case results and statistics
- TLE/MLE/RTE/CE/AC/WA verdict detection
- Report storage in MinIO as JSON
- ✅ Result publishing to backend via `codehive_result_queue`
- ✅ Backend listener updates `Execution` entity with results
