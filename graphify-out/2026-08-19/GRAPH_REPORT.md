# Graph Report - CodeHive  (2026-08-19)

## Corpus Check
- 606 files · ~197,916 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4917 nodes · 12303 edges · 318 communities (219 shown, 99 thin omitted)
- Extraction: 88% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 1405 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a7fd8c16`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Assignment Update Requests
- JWT Authentication Filter
- Sign-Up Request DTO
- Domain Exceptions
- Assignment Feedback & Student Work
- Execution Job Queue Model
- Frontend Assignment API Client
- User Notification Settings
- User DTO
- CSV Bulk Register Response
- Execution Report Model
- Execution Report (Queue)
- Caveman-Compress Benchmark Tooling
- Email Template Rendering
- C Language Executor
- Async Config & Ownership Permission Tests
- Notification Preferences
- Admin User Controller
- Group Metrics Overview
- Clone Assignment Request
- Language Executor Factory
- Assignment Controller Integration Tests
- Assignment Service & Clone DTOs
- Output Comparator Service
- Notification Email Listener
- Assignment Update Entity
- Notification Dispatch Log
- Execution Result Model
- Test Case Info (Queue)
- Assignment Entity
- Execution Entity
- Create Assignment Request
- Frontend Protected Route & Admin Pages
- Group Service
- Submission DTO
- Test Generation Listener
- Notification Format Service
- Frontend Execution API Client
- Group Controller
- Reevaluation Batch
- User Entity
- Group Controller Integration Tests
- Execution Request Service
- Submission Entity
- Auth Response
- StudentDashboardPage.tsx
- Scope.java
- TestSuiteRevision
- useTheme
- AppHeader.tsx
- PasswordResetToken
- JwtUtil
- ClassGroup
- .error
- teacher/api/assignment.api.ts
- RabbitConfig
- AssignmentController.java
- AssignmentFeedback
- UserDTO
- AssignmentGradeHistory
- auth.api.ts
- RecoveryPasswordController.java
- ExecutionTestCaseInfo
- RecoveryPasswordRequest
- CsvProgressMessage
- GroupMetricsControllerIntegrationTest.java
- Select.tsx
- compilerOptions
- DisplayName
- NotificationPreferenceController.java
- .buildExecutionJob
- ExecutionJob
- .getStatus
- ReevaluationService.java
- AssignmentDTO
- GroupDTO
- useAuth
- CheckExecutionControllerIntegrationTest.java
- .create
- DisplayName
- GroupServiceTest
- TestGenerationJob
- OutputComparatorService
- TeacherGroupDetailPage.tsx
- AdminUserController.java
- ObjectStorageService
- AbstractLanguageExecutor
- TeacherDashboardPage.tsx
- Backend Controller Layer
- AuthController.java
- GroupMetricsController.java
- ExecutionDTO
- CreateAssignmentPage.tsx
- DisplayName
- RateLimitAspect
- DisplayName
- dependencies
- ExecutionTestCaseInfo
- DisplayName
- devDependencies
- ExecutionTestCaseInfo
- Sequence Diagram Specifications: Groups, Assignments, Submissions, Grades, Feedback
- caveman
- clsx
- AdminUserControllerIntegrationTest
- TestGenerationResult
- AuthControllerIntegrationTest.java
- MockMultipartFile
- CsvProgressWebSocketHandler
- CheckExecutionController.java
- SubmissionController.java
- LandingPage.tsx
- NotificationDomainEventRouter
- Backend Model Implementation
- PythonExecutor
- CsvRegistrationService
- AssignmentRepository
- Métricas de desempeño para el docente
- Teacher Frontend
- UpdatePasswordRequest
- .fixture
- AuthProvider.tsx
- TestCaseInfo
- Rule 11: group-owner authorization parity across controllers
- AGENTS.md - CodeHive Root Instructions
- RecoveryPasswordControllerIntegrationTest.java
- TestCaseInfo
- NotificationDomainEventRouter
- teacherRequest
- RabbitMQConfig
- Backend Service Layer Implementation
- NotificationEmailListener
- LanguageExecutorFactoryTest
- CsvBulkRegisterResponse
- ExecutionStatus
- PageResponse
- OpenApiCoverageIntegrationTest.java
- Late-submission reconciliation on due-date change
- TestExecutionService
- PermissionMatrixIntegrationTest.java
- package.json
- NotificationDomainEventRouter
- Grupos, tareas y entregas
- ExecutionTestCaseInfo
- isbot
- CPPExecutor
- Core API workflow
- generate_fake_users.py
- Architecture
- .toEntity
- StudentWorkQueryService
- EmailTemplateConfig.java
- codehive/config/MinioConfig.java
- OpenAPIConfig.java
- Language
- @monaco-editor/react
- Programming identity
- Sliding-window test fixture guide
- DockerClientConfig.java
- worker/config/MinioConfig.java
- WorkerApplicationTests.java
- Backend CI
- AssignmentGradeDTO
- .setUp
- DisplayName
- .create
- ExecutionTrigger
- AssignmentValidationStatus
- local infrastructure services
- codehive-backend/gradlew
- CodehiveApplication
- AspectConfig.java
- CacheConfig.java
- SchedulingConfig.java
- SampleTestCaseDTO
- TestAsyncConfig.java
- jailbreak/main.js
- Main
- Main
- codehive-worker/gradlew
- WorkerApplication
- Main
- Welcome email template
- Main
- Main
- cpu_exhaustion/main.js
- Main
- fork_bomb/main.js
- Main
- Main
- Main
- Main
- stack_overflow/main.c
- Main
- generate_large_input.py
- TestcontainersConfiguration.java
- TestWorkerApplication
- __init__.py
- .fixture
- RevisionStatus
- .listGroupSubmissions
- Default user avatar
- Notification email template
- Frontend feature-based architecture
- Frontend Docker Compose service
- ObjectStorageService
- PageResponse
- WebSocketConfig
- @radix-ui/react-separator
- @radix-ui/react-slot
- @radix-ui/react-tabs
- react-dom
- @react-router/node
- @react-router/serve
- zustand
- chunks
- 02_create_assignment.sh
- TestGenerationResultListener
- Notification preference evaluation
- Scheduler deduplication
- Controller identity pattern
- Admin routes
- AsyncConfig.java
- lucide-react
- AdminInitializer.java
- Main
- framer-motion
- ComparatorType
- Main
- GroupCard.tsx
- Main
- Main
- Main
- Main
- Main
- ExecutionResultService (sequence spec)
- Execution (groups doc)
- Backend messaging
- ExecutionRequestProducer
- ExecutionResultListener
- TestGenerationRequestProducer
- Notification business rules
- Backend email notifications
- Notification functional requirements
- Notification technical design
- Backend security
- Role and scope authorization
- Admin frontend
- CSV upload progress
- Frontend components
- Frontend overview
- React Router v7 SPA
- Student frontend placeholder
- Worker comparator
- Worker execution lifecycle
- Worker TestGenerationRequestListener
- Worker overview
- Output limit exceeded
- Worker sandbox
- practice and definitive execution modes
- README.md
- GroupMetricsOverviewDTO
- EnrollmentNumberRules.java
- Shortest Path with One Discount
- create-assignment.sh

## God Nodes (most connected - your core abstractions)
1. `User` - 219 edges
2. `Assignment` - 195 edges
3. `UserRepository` - 108 edges
4. `Execution` - 81 edges
5. `AssignmentRepository` - 79 edges
6. `SuccessResponse` - 77 edges
7. `Language` - 75 edges
8. `EntityNotFoundException` - 74 edges
9. `AssignmentDTO` - 72 edges
10. `ClassGroup` - 71 edges

## Surprising Connections (you probably didn't know these)
- `Late-submission reconciliation on due-date change` --semantically_similar_to--> `Finding: AssignmentUpdateService now reconciles late flags and rejects past dates`  [INFERRED] [semantically similar]
  llms/backend/groups/README.md → graphify-out/memory/query_20260729_050038_update_teacher_due_date_flow_so_qualifying_late_su.md
- `Teacher Frontend` --conceptually_related_to--> `Finding: clone requires group+dates only; graph lacked frontend clone node at the time`  [INFERRED]
  llms/frontend/professor/README.md → graphify-out/memory/query_20260729_042800_when_an_assignment_is_cloned__what_is_expected_to.md
- `Null vs zero distinction for metrics without data` --semantically_similar_to--> `Grupos, tareas y entregas`  [INFERRED] [semantically similar]
  llms/backend/metrics/README.md → llms/backend/groups/README.md
- `Backend CI` --conceptually_related_to--> `pull request template`  [INFERRED]
  .github/workflows/backend-ci.yml → PR_template.md
- `asynchronous execution pipeline` --references--> `local infrastructure services`  [INFERRED]
  README.md → codehive-backend/docker-compose.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Definitive submission creation and evaluation call chain** — docs_diagrams_sequence_diagram_flows_checkexecutioncontroller, docs_diagrams_sequence_diagram_flows_executionrequestservice, docs_diagrams_sequence_diagram_flows_executionresultservice, llms_backend_service_readme_objectstorageservice [EXTRACTED 1.00]
- **Controllers unified under group-owner authorization (rule 11)** — llms_backend_groups_readme_groupcontroller, llms_backend_groups_readme_groupmetricscontroller, llms_backend_groups_readme_assignmentcontroller, llms_backend_groups_readme_assignmentstudentworkcontroller [EXTRACTED 1.00]
- **Metrics composing the group overview endpoint response** — llms_backend_metrics_readme_m1_submissionrate, llms_backend_metrics_readme_m4_ontimerate, llms_backend_metrics_readme_m11_gradingprogress, llms_backend_metrics_readme_m12_enrollment [EXTRACTED 1.00]

## Communities (318 total, 99 thin omitted)

### Community 0 - "Assignment Update Requests"
Cohesion: 0.08
Nodes (8): fromValue(), TestSuiteUpdateMode, APPEND, REPLACE_ALL, UpdateAssignmentRequest, Query, JsonCreator, Modifying

### Community 1 - "JWT Authentication Filter"
Cohesion: 0.15
Nodes (10): ClaimExtractionTests, EdgeCaseTests, BeforeEach, DisplayName, Nested, Test, JwtUtilTest, TokenExpirationTests (+2 more)

### Community 3 - "Domain Exceptions"
Cohesion: 0.07
Nodes (21): ArtifactExpiredException, AlreadyRegisteredEmailException, AlreadyRegisteredEnrollmentNumberException, ExpiredJWTException, IncorrectCredentialsException, InvalidJWTException, GlobalExceptionHandler, ResponseEntity (+13 more)

### Community 4 - "Assignment Feedback & Student Work"
Cohesion: 0.14
Nodes (10): AuthService, AuthResponse, MultipartFile, PasswordEncoder, Pattern, Service, Transactional, User (+2 more)

### Community 5 - "Execution Job Queue Model"
Cohesion: 0.07
Nodes (15): RabbitListener, Transactional, Entity, Table, ReferenceSolutionRevision, Entity, Table, TestSuiteRevision (+7 more)

### Community 6 - "Frontend Assignment API Client"
Cohesion: 0.14
Nodes (19): AssignmentControllerIntegrationTest, CreateAssignment, GetAssignmentById, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, ClassGroup, DisplayName (+11 more)

### Community 7 - "User Notification Settings"
Cohesion: 0.08
Nodes (28): NotificationPreferenceDTO, NotificationType, ASSIGNMENT_CLOSE_SOON, ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION, ASSIGNMENT_DUE_SOON, ASSIGNMENT_DUE_SOON_NO_SUBMISSION, ASSIGNMENT_GRADES_CLEARED, ASSIGNMENT_PUBLISHED (+20 more)

### Community 8 - "User DTO"
Cohesion: 0.23
Nodes (10): DTOToEntityTests, EntityToDTOTests, BeforeEach, DisplayName, Nested, Test, User, ListMappingTests (+2 more)

### Community 9 - "CSV Bulk Register Response"
Cohesion: 0.27
Nodes (8): ExecutionResultListener, Component, Logger, RabbitListener, ExecutionResultService, Logger, Service, Transactional

### Community 11 - "Execution Report (Queue)"
Cohesion: 0.04
Nodes (13): ExecutionReport, TestCaseResult, RecentSubmissionDTO, StudentSubmissionHistoryDTO, ExecutionStatus, AC, CE, MLE (+5 more)

### Community 12 - "Caveman-Compress Benchmark Tooling"
Cohesion: 0.08
Nodes (44): benchmark_pair(), count_tokens(), main(), print_table(), Path, main(), print_usage(), build_compress_prompt() (+36 more)

### Community 13 - "Email Template Rendering"
Cohesion: 0.09
Nodes (25): EmailTemplateRenderer, Component, TemplateEngine, RenderedEmail, NotificationEmailContent, Async, JavaMailSender, Logger (+17 more)

### Community 14 - "C Language Executor"
Cohesion: 0.19
Nodes (6): CExecutor, Component, DockerClient, Override, CExecutorTest, Test

### Community 15 - "Async Config & Ownership Permission Tests"
Cohesion: 0.04
Nodes (13): ClassGroup, Entity, Table, GroupEnrollment, Fixture, Assignment, ClassGroup, GroupEnrollment (+5 more)

### Community 16 - "Notification Preferences"
Cohesion: 0.15
Nodes (16): STUDENT_NAV, STUDENT_SIDEBAR_ITEMS, STUDENT_STATS_ICONS, deleteAssignment(), getActiveTeacherGroups(), getTeacherAssignments(), TEACHER_CREATE_NAV, TEACHER_CREATE_SIDEBAR_ITEMS (+8 more)

### Community 17 - "Admin User Controller"
Cohesion: 0.27
Nodes (15): AssignmentController, ApiResponses, Authentication, DeleteMapping, GetMapping, Logger, MultipartFile, Operation (+7 more)

### Community 18 - "Group Metrics Overview"
Cohesion: 0.08
Nodes (29): Entity, Table, forRole(), getAudience(), ApplicationEventPublisher, Component, NotificationDomainEventPublisher, AssignmentFeedbackRepository (+21 more)

### Community 19 - "Clone Assignment Request"
Cohesion: 0.08
Nodes (3): CloneAssignmentRequest, CloneTestCaseRequest, TestCaseInfo

### Community 20 - "Language Executor Factory"
Cohesion: 0.09
Nodes (17): Component, Logger, LanguageExecutorFactory, LanguageExecutor, ExecutionReport, Logger, ObjectMapper, Service (+9 more)

### Community 21 - "Assignment Controller Integration Tests"
Cohesion: 0.08
Nodes (24): CsvBulkRegisterResponse, JsonInclude, AssignmentsHonorOwnership, GroupsHonorOwnership, DisplayName, Nested, Test, User (+16 more)

### Community 22 - "Assignment Service & Clone DTOs"
Cohesion: 0.12
Nodes (10): AssignmentUpdateDTO, AssignmentLimits, AssignmentUpdateService, ApplicationEventPublisher, AssignmentUpdate, MultipartFile, ObjectMapper, Service (+2 more)

### Community 23 - "Output Comparator Service"
Cohesion: 0.21
Nodes (7): ExactMatch, FloatingPoint, BeforeEach, DisplayName, Nested, Test, OutputComparatorServiceTest

### Community 24 - "Notification Email Listener"
Cohesion: 0.12
Nodes (18): Component, Logger, RabbitListener, Transactional, NotificationEmailListener, Component, Logger, RabbitTemplate (+10 more)

### Community 25 - "Assignment Update Entity"
Cohesion: 0.07
Nodes (11): AssignmentUpdate, Entity, Table, AssignmentUpdateKind, METADATA, REFERENCE_ONLY, TEST_SUITE, AssignmentUpdateStatus (+3 more)

### Community 26 - "Notification Dispatch Log"
Cohesion: 0.05
Nodes (16): Entity, Override, Table, User, Role, ADMIN, STUDENT, TEACHER (+8 more)

### Community 27 - "Execution Result Model"
Cohesion: 0.11
Nodes (11): ExecutionResult, CE, ExecutionResultTest, DisplayName, Nested, Test, MLE, OLE (+3 more)

### Community 28 - "Test Case Info (Queue)"
Cohesion: 0.06
Nodes (7): TestGenerationJob, ComparatorType, EXACT_MATCH, FLOATING_POINT, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 29 - "Assignment Entity"
Cohesion: 0.03
Nodes (8): Assignment, Entity, Table, AssignmentExample, Entity, Table, AssignmentExampleRepository, Assignment

### Community 30 - "Execution Entity"
Cohesion: 0.10
Nodes (10): Execution, Entity, Table, ExecutionTrigger, ASSIGNMENT_UPDATE, INITIAL_SUBMISSION, MANUAL_RETRY, PRACTICE (+2 more)

### Community 32 - "Frontend Protected Route & Admin Pages"
Cohesion: 0.05
Nodes (8): ProtectedRoute(), ProtectedRouteProps, AuthContextType, CreateUserPage(), ROLE_OPTIONS, CsvUploadPage(), Role, Scope

### Community 33 - "Group Service"
Cohesion: 0.07
Nodes (17): AccessDeniedException, EntityNotFoundException, ValidationException, CreateGroupRequest, AssignmentFeedback, Transactional, GroupService, ClassGroup (+9 more)

### Community 34 - "Submission DTO"
Cohesion: 0.12
Nodes (4): JsonInclude, SubmissionDTO, Submission, SubmissionMapper

### Community 35 - "Test Generation Listener"
Cohesion: 0.06
Nodes (17): Component, Logger, RabbitListener, TestGenerationRequestListener, Logger, RabbitTemplate, Service, TestGenerationResultProducer (+9 more)

### Community 36 - "Notification Format Service"
Cohesion: 0.05
Nodes (17): AssignmentFeedback, Entity, Table, Entity, Table, StudentAssignmentWork, FeedbackStatus, DELETED (+9 more)

### Community 37 - "Frontend Execution API Client"
Cohesion: 0.06
Nodes (30): getAssignment(), getExecution(), getExecutionReport(), listAssignmentSubmissions(), AssignmentPage(), LANGUAGE_FILE, LANGUAGE_LABELS, LANGUAGE_TEMPLATES (+22 more)

### Community 38 - "Group Controller"
Cohesion: 0.19
Nodes (17): GroupController, ApiResponses, Authentication, DeleteMapping, GetMapping, Operation, PatchMapping, PostMapping (+9 more)

### Community 39 - "Reevaluation Batch"
Cohesion: 0.08
Nodes (11): Entity, Table, ReevaluationBatch, ReevaluationBatchStatus, COMPLETED, COMPLETED_WITH_FAILURES, DISPATCHING, PROCESSING (+3 more)

### Community 40 - "User Entity"
Cohesion: 0.09
Nodes (11): byteSize(), CreateAssignmentPage(), EXT_TO_LANG, LANGUAGE_TEMPLATES, LANGUAGES, lineCount(), PublishMode, SolutionMode (+3 more)

### Community 41 - "Group Controller Integration Tests"
Cohesion: 0.14
Nodes (12): GroupControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, DisplayName, MockMvc, ObjectMapper, PasswordEncoder (+4 more)

### Community 42 - "Execution Request Service"
Cohesion: 0.13
Nodes (12): EnrollmentStatusCount, Query, Assignment, BeforeEach, ClassGroup, DataJpaTest, EntityManager, StudentAssignmentWork (+4 more)

### Community 43 - "Submission Entity"
Cohesion: 0.16
Nodes (4): JsonInclude, UserDTO, UserMapper, AuthResponse

### Community 44 - "Auth Response"
Cohesion: 0.18
Nodes (5): ReevaluationRequestedEvent, AssignmentUpdateServiceTest, Assignment, Test, UpdateFixture

### Community 45 - "StudentDashboardPage.tsx"
Cohesion: 0.31
Nodes (10): GroupMetricsController, ApiResponses, Authentication, GetMapping, Operation, ResponseEntity, RestController, SuccessResponse (+2 more)

### Community 46 - "Scope.java"
Cohesion: 0.24
Nodes (6): Test, UserAuthoritiesTest, DataJpaTest, EntityManager, Test, UserRepositoryTest

### Community 47 - "TestSuiteRevision"
Cohesion: 0.06
Nodes (8): ExecutionJob, Language, C, CPP, JAVA, PYTHON, ExecutionJobCreatedEvent, TransactionalEventListener

### Community 48 - "useTheme"
Cohesion: 0.14
Nodes (8): ContentTypeTests, CsvSignUpEndpointTests, DisplayName, Nested, Test, LoginEndpointTests, SecurityTests, SignUpEndpointTests

### Community 49 - "AppHeader.tsx"
Cohesion: 0.06
Nodes (11): Entity, Table, TestCase, TestCaseInfo, ExecutionJob, ExecutionTestCaseInfo, ExecutionJob, ExecutionTestCaseInfo (+3 more)

### Community 50 - "PasswordResetToken"
Cohesion: 0.14
Nodes (14): Entity, Table, PasswordResetToken, PasswordResetTokenRepository, PasswordEncoder, Service, Transactional, RecoveryPasswordService (+6 more)

### Community 51 - "JwtUtil"
Cohesion: 0.20
Nodes (6): JsonInclude, AssignmentMetricsDTO, AssignmentValidationStatus, FAILED, PROCESSING, READY

### Community 52 - "ClassGroup"
Cohesion: 0.06
Nodes (40): listAssignments(), listAssignmentsForGroups(), listMyAssignmentFeedback(), listMyAssignmentOverviews(), listRecentSubmissions(), withdrawSubmission(), GradeFilter, GradesPage() (+32 more)

### Community 53 - ".error"
Cohesion: 0.36
Nodes (5): EnrollmentNumberRulesTest, Test, EnumSource, ParameterizedTest, ValueSource

### Community 54 - "teacher/api/assignment.api.ts"
Cohesion: 0.11
Nodes (29): cloneAssignment(), createAssignment(), getAssignmentUpdate(), getCloneAssignmentForm(), multipartMetadata(), multipartRequest(), updateAssignment(), teacherAuthHeaders() (+21 more)

### Community 55 - "RabbitConfig"
Cohesion: 0.22
Nodes (6): Binding, Bean, Configuration, MessageConverter, RabbitConfig, DirectExchange

### Community 56 - "AssignmentController.java"
Cohesion: 0.05
Nodes (18): Entity, Table, UserNotificationPreference, Entity, Table, UserNotificationSettings, UpdateNotificationPreferenceRequest, UpdateNotificationSettingsRequest (+10 more)

### Community 57 - "AssignmentFeedback"
Cohesion: 0.24
Nodes (15): AuthController, ApiResponses, Authentication, GetMapping, MultipartFile, Operation, PostMapping, PreAuthorize (+7 more)

### Community 59 - "AssignmentGradeHistory"
Cohesion: 0.16
Nodes (21): AssignmentStudentWorkController, Authentication, DeleteMapping, GetMapping, Operation, PostMapping, PreAuthorize, PutMapping (+13 more)

### Community 60 - "auth.api.ts"
Cohesion: 0.16
Nodes (20): CsvProgressMessage, CsvTaskResponse, forgotPassword(), getMe(), login(), resetPassword(), signUp(), updatePassword() (+12 more)

### Community 61 - "RecoveryPasswordController.java"
Cohesion: 0.15
Nodes (15): ApiResponses, Operation, PostMapping, RequestMapping, ResponseEntity, RestController, SecurityRequirements, SuccessResponse (+7 more)

### Community 62 - "ExecutionTestCaseInfo"
Cohesion: 0.05
Nodes (49): ApplicationEvents, Component, Logger, TestGenerationResultListener, Logger, RabbitTemplate, Service, TestGenerationRequestProducer (+41 more)

### Community 64 - "CsvProgressMessage"
Cohesion: 0.09
Nodes (6): CsvProgressMessage, Status, COMPLETED, PROCESSING, ROW_ERROR, ROW_SUCCESS

### Community 66 - "Select.tsx"
Cohesion: 0.10
Nodes (19): Badge(), BadgeProps, badgeVariants, Button, ButtonProps, buttonVariants, SelectContent, SelectItem (+11 more)

### Community 67 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit, paths (+17 more)

### Community 68 - "DisplayName"
Cohesion: 0.24
Nodes (7): AddTestCase, DetermineOverallStatus, ExecutionReportTest, DisplayName, Nested, Test, TestCaseResult

### Community 69 - "NotificationPreferenceController.java"
Cohesion: 0.07
Nodes (9): EnrollmentDTO, EnrollmentStudentDTO, GroupDTO, JsonInclude, EnrollmentStatus, ACTIVE, LEFT, REMOVED (+1 more)

### Community 70 - ".buildExecutionJob"
Cohesion: 0.29
Nodes (10): AuthenticationManager, AuthenticationProvider, Bean, Configuration, PasswordEncoder, SecurityConfig, EnableMethodSecurity, EnableWebSecurity (+2 more)

### Community 71 - "ExecutionJob"
Cohesion: 0.09
Nodes (4): ExecutionJob, ExecutionType, DEFINITIVE, PRACTICE

### Community 72 - ".getStatus"
Cohesion: 0.23
Nodes (8): AfterAll, BeforeAll, DisplayName, DockerClient, Tag, Test, SandboxSecurityTest, TestMethodOrder

### Community 73 - "ReevaluationService.java"
Cohesion: 0.09
Nodes (21): Assertions, Before writing tests, Boundary cases, Dependency behavior, Determine test scenarios, Execution, Existing implementation vs expected behavior, Existing tests (+13 more)

### Community 74 - "AssignmentDTO"
Cohesion: 0.07
Nodes (3): AssignmentDTO, AssignmentMapper, Assignment

### Community 75 - "GroupDTO"
Cohesion: 0.12
Nodes (9): ExecutionStatus, AC, CE, MLE, OLE, PENDING, RTE, TLE (+1 more)

### Community 76 - "useAuth"
Cohesion: 0.08
Nodes (4): ExecutionType, DEFINITIVE, PRACTICE, ExecutionRequest

### Community 77 - "CheckExecutionControllerIntegrationTest.java"
Cohesion: 0.11
Nodes (7): AssignmentNotificationStrategy, Component, Override, Override, Override, AssignmentNotificationStrategyTest, Test

### Community 78 - ".create"
Cohesion: 0.05
Nodes (23): SubmissionAttemptCount, Entity, Table, Submission, SubmissionStatus, SUBMITTED, SUPERSEDED, WITHDRAWN (+15 more)

### Community 79 - "DisplayName"
Cohesion: 0.22
Nodes (5): DisplayName, Nested, Test, ResetPasswordTests, SendPasswordResetEmailTests

### Community 80 - "GroupServiceTest"
Cohesion: 0.13
Nodes (6): UpdateUserRequest, Scope, AdminUserService, Page, Service, Transactional

### Community 81 - "TestGenerationJob"
Cohesion: 0.10
Nodes (4): TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 82 - "OutputComparatorService"
Cohesion: 0.21
Nodes (15): jsonBody(), studentRequest(), submitExecution(), joinGroup(), getNotificationSettings(), NotificationPreference, NotificationSettings, resetNotificationSettings() (+7 more)

### Community 83 - "TeacherGroupDetailPage.tsx"
Cohesion: 0.07
Nodes (27): `ai_assistance_interactions`, `ai_assistance_usage`, `ai_data_consents`, Assignment configuration, Assignment regression tests, Assistant call, Assistant service tests, Configuration (+19 more)

### Community 84 - "AdminUserController.java"
Cohesion: 0.29
Nodes (14): AdminUserController, ApiResponses, Authentication, DeleteMapping, GetMapping, Operation, PatchMapping, PostMapping (+6 more)

### Community 85 - "ObjectStorageService"
Cohesion: 0.31
Nodes (12): Authentication, GetMapping, Operation, PostMapping, PreAuthorize, RequestMapping, ResponseEntity, RestController (+4 more)

### Community 86 - "AbstractLanguageExecutor"
Cohesion: 0.20
Nodes (4): AbstractLanguageExecutor, DockerClient, Logger, HostConfig

### Community 87 - "TeacherDashboardPage.tsx"
Cohesion: 0.28
Nodes (3): Scheduled, Transactional, Test

### Community 88 - "Backend Controller Layer"
Cohesion: 0.12
Nodes (22): AdminUserController, AssignmentController, AuthController, CheckExecutionController, Backend Controller Layer, GlobalExceptionHandler, NotificationPreferenceController, RecoveryPasswordController (+14 more)

### Community 89 - "AuthController.java"
Cohesion: 0.04
Nodes (26): AssignmentGrade, Entity, Table, AssignmentGradeHistory, Entity, Table, GradeChangeReason, CLEARED_MAX_POINTS_CHANGED (+18 more)

### Community 90 - "GroupMetricsController.java"
Cohesion: 0.16
Nodes (22): listTeacherGroups(), getAssignmentMetrics(), getGroupMetricsOverview(), listAssignmentMetrics(), listStudentMetrics(), percentage(), TeacherAnalyticsPage(), TeacherDashboardPage() (+14 more)

### Community 91 - "ExecutionDTO"
Cohesion: 0.05
Nodes (41): AuthContext, AuthProvider(), useAuth(), getInitialTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider() (+33 more)

### Community 92 - "CreateAssignmentPage.tsx"
Cohesion: 0.26
Nodes (8): ExecutionRequestProducer, Logger, RabbitTemplate, Service, ReevaluationBatchRepository, ApplicationEventPublisher, Service, ReevaluationService

### Community 93 - "DisplayName"
Cohesion: 0.21
Nodes (7): GetExecution, GetReport, DisplayName, Nested, Test, User, SubmitExecution

### Community 94 - "RateLimitAspect"
Cohesion: 0.19
Nodes (11): Around, Aspect, Bucket, Component, HttpServletRequest, Logger, RateLimitAspect, Service (+3 more)

### Community 95 - "DisplayName"
Cohesion: 0.26
Nodes (20): teacherRequest(), archiveGroup(), createGroup(), deleteGroup(), getTeacherGroup(), groupPath(), listGroupStudents(), removeGroupStudent() (+12 more)

### Community 96 - "dependencies"
Cohesion: 0.11
Nodes (19): class-variance-authority, dependencies, class-variance-authority, isbot, monaco-editor, @radix-ui/react-select, react, react-resizable-panels (+11 more)

### Community 97 - "ExecutionTestCaseInfo"
Cohesion: 0.10
Nodes (14): Scope, CHECK_ANALYTICS, CREATE_ADMINS, CREATE_GROUP, CREATE_USERS, MANAGE_ADMIN_STATUS, MANAGE_GROUPS, MANAGE_SCOPES (+6 more)

### Community 98 - "DisplayName"
Cohesion: 0.14
Nodes (17): ForgotPasswordRequest, ContentTypeTests, ForgotPasswordEndpointTests, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, DisplayName, MockMvc (+9 more)

### Community 99 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, @react-router/dev, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+11 more)

### Community 100 - "ExecutionTestCaseInfo"
Cohesion: 0.10
Nodes (17): getTeacherAssignment(), getTeacherAssignmentPage(), getTeacherAssignmentPreview(), normalizeAssignment(), byteSize(), currentMinimumDate(), EditableTestCase, EditAssignmentPage() (+9 more)

### Community 101 - "Sequence Diagram Specifications: Groups, Assignments, Submissions, Grades, Feedback"
Cohesion: 0.11
Nodes (19): AssignmentController (sequence spec), AssignmentFeedbackService (sequence spec), AssignmentGradeService (sequence spec), AssignmentService (sequence spec), AssignmentStudentWorkController (sequence spec), CheckExecutionController (sequence spec), Flow 3: Create assignment, Flow 4: Create submission and evaluate it (+11 more)

### Community 102 - "caveman"
Cohesion: 0.11
Nodes (18): cavecrew, cavecrew delegation matrix, cavecrew-builder, cavecrew-investigator, cavecrew-reviewer, caveman-commit, Conventional Commits, caveman-compress (+10 more)

### Community 103 - "clsx"
Cohesion: 0.22
Nodes (16): jsonRequest(), assignmentPath(), createFeedback(), deleteFeedback(), getStudentWork(), listFeedback(), listStudentWork(), returnGrade() (+8 more)

### Community 104 - "AdminUserControllerIntegrationTest"
Cohesion: 0.16
Nodes (13): Component, HttpServletRequest, Logger, Override, JWTAuthenticationFilter, Override, Service, UserDetails (+5 more)

### Community 105 - "TestGenerationResult"
Cohesion: 0.24
Nodes (11): AuthControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, Import, MockMvc, ObjectMapper, PasswordEncoder (+3 more)

### Community 107 - "MockMultipartFile"
Cohesion: 0.14
Nodes (10): AcceptedPerformance, AssignmentMetricsDetailDTO, GradeSummary, StudentBreakdown, StudentRef, StudentWorkStatus, NOT_SUBMITTED, RETURNED (+2 more)

### Community 108 - "CsvProgressWebSocketHandler"
Cohesion: 0.23
Nodes (10): CloseStatus, CsvProgressWebSocketHandler, Component, Logger, ObjectMapper, Override, PreDestroy, TextMessage (+2 more)

### Community 109 - "CheckExecutionController.java"
Cohesion: 0.29
Nodes (11): CheckExecutionController, ApiResponses, Authentication, GetMapping, Operation, PostMapping, RequestMapping, ResponseEntity (+3 more)

### Community 110 - "SubmissionController.java"
Cohesion: 0.25
Nodes (8): CsvRegistrationService, Async, Logger, PasswordEncoder, Pattern, Service, CSVRecord, ObjectProvider

### Community 111 - "LandingPage.tsx"
Cohesion: 0.17
Nodes (8): Features, Footer(), footerLinks, socialLinks, Hero(), HowItWorks(), steps, LandingPage()

### Community 113 - "Backend Model Implementation"
Cohesion: 0.15
Nodes (16): M6 verdictDistribution, Assignment entity, AssignmentUpdate entity, ClassGroup entity, CreateAssignmentRequest, Backend Model Implementation, Execution entity, ExecutionJob (queue DTO) (+8 more)

### Community 114 - "PythonExecutor"
Cohesion: 0.26
Nodes (4): Component, DockerClient, Override, PythonExecutor

### Community 115 - "CsvRegistrationService"
Cohesion: 0.09
Nodes (3): ExecutionDTO, JsonInclude, ExecutionMapper

### Community 116 - "AssignmentRepository"
Cohesion: 0.26
Nodes (12): Authentication, GetMapping, Operation, PostMapping, PutMapping, RequestMapping, ResponseEntity, RestController (+4 more)

### Community 117 - "Métricas de desempeño para el docente"
Cohesion: 0.13
Nodes (15): Métricas de desempeño para el docente, M10 missingCount / missingStudents, M11 gradingProgress, M12 enrollment summary, M1 submissionRate, M2 averageScore per assignment, M3 averageScore per student, M5 averageDeliveryMarginHours (+7 more)

### Community 118 - "Teacher Frontend"
Cohesion: 0.25
Nodes (11): assignment.api.ts (teacher feature API module), /teacher/assignments/:assignmentId/clone route, Clone flow never inherits source scheduling dates, /teacher/create-assignment route, Teacher Frontend, /teacher/assignments route, /teacher dashboard route, Frontend Routes Implementation (+3 more)

### Community 119 - "UpdatePasswordRequest"
Cohesion: 0.15
Nodes (13): GroupMetricsControllerIntegrationTest, ActiveProfiles, Assignment, AutoConfigureMockMvc, BeforeEach, ClassGroup, DisplayName, MockMvc (+5 more)

### Community 122 - "TestCaseInfo"
Cohesion: 0.31
Nodes (4): Claims, Component, JwtUtil, SecretKey

### Community 123 - "Rule 11: group-owner authorization parity across controllers"
Cohesion: 0.17
Nodes (12): Query: Is group student list visible only to teacher?, Finding: only group-owning teacher could originally list students, Query: extend roster visibility to enrolled students, Finding: requireStudentListAccess() authorizes owner or active enrollment, list-only, AssignmentController (groups doc), AssignmentStudentWorkController (groups doc), GroupController (groups doc), GroupMetricsController (+4 more)

### Community 124 - "AGENTS.md - CodeHive Root Instructions"
Cohesion: 0.18
Nodes (12): codehive-backend (Spring Boot REST API, Java 21), codehive-frontend (React Router v7 SPA, TypeScript), codehive_queue (backend to worker execution jobs), codehive_result_queue (worker to backend execution results), codehive_test_generation_queue (backend to worker), codehive-worker (Spring Boot sandbox executor, Java 21), utils/ObjectKeyBuilder, AGENTS.md - CodeHive Root Instructions (+4 more)

### Community 127 - "NotificationDomainEventRouter"
Cohesion: 0.11
Nodes (12): Entity, Table, NotificationDispatchLog, NotificationDomainEvent, Service, Transactional, NotificationDispatchService, Component (+4 more)

### Community 128 - "teacherRequest"
Cohesion: 0.60
Nodes (3): ObjectMapper, Test, TestSuiteUpdateModeTest

### Community 129 - "RabbitMQConfig"
Cohesion: 0.31
Nodes (5): Bean, Configuration, MessageConverter, RabbitMQConfig, SuppressWarnings

### Community 130 - "Backend Service Layer Implementation"
Cohesion: 0.24
Nodes (11): GroupController, AdminUserService, AuthService, CsvRegistrationService, Backend Service Layer Implementation, ExecutionRequestService (service doc), ExecutionResultService (service doc), GroupService (service doc) (+3 more)

### Community 131 - "NotificationEmailListener"
Cohesion: 0.18
Nodes (11): Role-specific notification catalog, Notification retry policy, NotificationDomainEvent, NotificationMessage, NotificationStrategyRegistry, Future notification requirements, Notification delivery workflow, Transactional email (+3 more)

### Community 132 - "LanguageExecutorFactoryTest"
Cohesion: 0.15
Nodes (9): CurrentSubmissionRow, StudentGradeRow, SubmissionResultRow, Query, Query, GroupMetricsService, GroupSnapshot, Service (+1 more)

### Community 133 - "CsvBulkRegisterResponse"
Cohesion: 0.38
Nodes (4): ComparisonResult, Logger, Service, OutputComparatorService

### Community 134 - "ExecutionStatus"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Search controllers and create frontend teacher API services, types, and page integrations for teacher actions, Source Nodes

### Community 135 - "PageResponse"
Cohesion: 0.22
Nodes (9): ExecutionRequestListener, Component, ExecutionReport, Logger, RabbitListener, ExecutionResultProducer, Logger, RabbitTemplate (+1 more)

### Community 136 - "OpenApiCoverageIntegrationTest.java"
Cohesion: 0.36
Nodes (7): ActiveProfiles, AutoConfigureMockMvc, MockMvc, ObjectMapper, SpringBootTest, Test, OpenApiCoverageIntegrationTest

### Community 137 - "Late-submission reconciliation on due-date change"
Cohesion: 0.29
Nodes (10): Query: effect of teacher updating due date on late submissions, Finding: deliveredLate not recalculated on due-date update; no past-date validation existed, AssignmentUpdateService, Query: update due-date flow to reconcile late submissions and reject past dates, Finding: AssignmentUpdateService now reconciles late flags and rejects past dates, Late-submission reconciliation on due-date change, M4 onTimeRate / lateCount, Submission entity (+2 more)

### Community 138 - "TestExecutionService"
Cohesion: 0.20
Nodes (10): Backend queue topology, OutputComparatorService, Compilation gate, TestExecutionService, Worker ExecutionRequestListener, Worker messaging, Sandboxed execution worker, Container security hardening (+2 more)

### Community 139 - "PermissionMatrixIntegrationTest.java"
Cohesion: 0.11
Nodes (13): AssignmentPreviewDTO, AssignmentPreviewTestCaseDTO, CloneAssignmentFormDTO, CloneAssignmentTestCaseDTO, AssignmentService, Logger, MultipartFile, Page (+5 more)

### Community 140 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, start, typecheck, type

### Community 142 - "Grupos, tareas y entregas"
Cohesion: 0.21
Nodes (12): CloneAssignmentRequest, Query: expected frontend behavior when an assignment is cloned, Finding: clone requires group+dates only; graph lacked frontend clone node at the time, Assignment (groups doc), AssignmentFeedback (groups doc), AssignmentGrade (groups doc), ClassGroup, Grupos, tareas y entregas (+4 more)

### Community 143 - "ExecutionTestCaseInfo"
Cohesion: 0.21
Nodes (10): AdminUserControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, MockMvc, PasswordEncoder, SpringBootTest, Test (+2 more)

### Community 146 - "CPPExecutor"
Cohesion: 0.26
Nodes (4): CPPExecutor, Component, DockerClient, Override

### Community 147 - "Core API workflow"
Cohesion: 0.32
Nodes (8): Assignment creation examples, Assignment updates and evaluation workflow, Staged assignment update, Core API workflow, Definitive submission, Practice execution, Negative and boundary scenarios, Manual API testing guide

### Community 148 - "generate_fake_users.py"
Cohesion: 0.52
Nodes (6): generate_email(), generate_enrollment_number(), generate_users(), main(), random_last_name(), random_name()

### Community 149 - "Architecture"
Cohesion: 0.14
Nodes (12): Architecture, Backend (`codehive-backend/`), Backend key flows, Commands, Custom Docker execution images, Frontend (`codehive-frontend/`), Frontend structure, Infrastructure env vars (+4 more)

### Community 150 - ".toEntity"
Cohesion: 0.26
Nodes (4): Component, DockerClient, Override, JavaExecutor

### Community 152 - "EmailTemplateConfig.java"
Cohesion: 0.53
Nodes (4): EmailTemplateConfig, Bean, Configuration, TemplateEngine

### Community 153 - "codehive/config/MinioConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, MinioClient, MinioConfig

### Community 154 - "OpenAPIConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, OpenAPIConfig, OpenAPI

### Community 155 - "Language"
Cohesion: 0.17
Nodes (5): Language, C, CPP, JAVA, PYTHON

### Community 157 - "Programming identity"
Cohesion: 0.40
Nodes (6): CodeHive brand logo, Hexagonal badge motif, High-contrast navy and gold palette, Hive-inspired badge rationale, CodeHive primary logo mark, Programming identity

### Community 158 - "Sliding-window test fixture guide"
Cohesion: 0.33
Nodes (6): Sliding-window test fixture guide, Sliding-window sample input, Sliding-window hidden input two, All-negative sliding-window input, Single-element sliding-window input, Mixed-value sliding-window input

### Community 159 - "DockerClientConfig.java"
Cohesion: 0.53
Nodes (4): DockerClientConfig, Bean, Configuration, DockerClient

### Community 160 - "worker/config/MinioConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, MinioClient, MinioConfig

### Community 161 - "WorkerApplicationTests.java"
Cohesion: 0.53
Nodes (4): Import, SpringBootTest, Test, WorkerApplicationTests

### Community 162 - "Backend CI"
Cohesion: 0.40
Nodes (5): Dependabot updates, Backend CI, CI/CD Pipeline, Worker CI, pull request template

### Community 163 - "AssignmentGradeDTO"
Cohesion: 0.42
Nodes (3): Service, Transactional, StudentWorkQueryService

### Community 164 - ".setUp"
Cohesion: 0.26
Nodes (5): Override, ContainerSession, ContainerSessionTest, DisplayName, Test

### Community 165 - "DisplayName"
Cohesion: 0.35
Nodes (4): SandboxConstants, DisplayName, Test, SandboxConstantsTest

### Community 168 - "AssignmentValidationStatus"
Cohesion: 0.48
Nodes (4): Component, NotificationFormatService, GroupNotificationStrategy, Component

### Community 169 - "local infrastructure services"
Cohesion: 0.50
Nodes (4): local infrastructure services, MinIO lifecycle policy, CodeHive, asynchronous execution pipeline

### Community 170 - "codehive-backend/gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 172 - "AspectConfig.java"
Cohesion: 0.83
Nodes (3): AspectConfig, Configuration, EnableAspectJAutoProxy

### Community 173 - "CacheConfig.java"
Cohesion: 0.83
Nodes (3): CacheConfig, Configuration, EnableCaching

### Community 174 - "SchedulingConfig.java"
Cohesion: 0.83
Nodes (3): Configuration, SchedulingConfig, EnableScheduling

### Community 176 - "TestAsyncConfig.java"
Cohesion: 0.47
Nodes (4): AsyncConfigurer, Override, TestConfiguration, TestAsyncConfig

### Community 180 - "codehive-worker/gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 183 - "Welcome email template"
Cohesion: 1.00
Nodes (3): Welcome email template, Plain-text welcome template, Backend authentication model

### Community 207 - "ObjectStorageService"
Cohesion: 0.40
Nodes (3): Edge, to, weight

### Community 209 - "WebSocketConfig"
Cohesion: 0.33
Nodes (6): Configuration, Override, WebSocketConfig, EnableWebSocket, WebSocketConfigurer, WebSocketHandlerRegistry

### Community 244 - "AsyncConfig.java"
Cohesion: 0.46
Nodes (5): AsyncConfig, Bean, Configuration, EnableAsync, ThreadPoolTaskExecutor

### Community 246 - "AdminInitializer.java"
Cohesion: 0.36
Nodes (6): AdminInitializer, Component, Logger, Override, PasswordEncoder, CommandLineRunner

### Community 249 - "ComparatorType"
Cohesion: 0.25
Nodes (3): ComparatorType, EXACT_MATCH, FLOATING_POINT

### Community 251 - "GroupCard.tsx"
Cohesion: 0.10
Nodes (22): getGroup(), leaveGroup(), listMyGroups(), listGroupSubmissions(), GroupCardProps, StudentBreadcrumb, StudentHeader(), StudentNavigation (+14 more)

### Community 314 - "GroupMetricsOverviewDTO"
Cohesion: 0.40
Nodes (4): AssignmentBreakdown, EnrollmentBreakdown, GradingProgress, GroupMetricsOverviewDTO

### Community 316 - "Shortest Path with One Discount"
Cohesion: 0.50
Nodes (3): Create, Shortest Path with One Discount, Structure

## Knowledge Gaps
- **465 isolated node(s):** `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE`, `VALIDATING`, `APPLIED` (+460 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **99 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `.students()` (2× useful, score=1.418884937)
- `.listStudents()` (2× useful, score=1.418884937) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Notification Dispatch Log` to `Assignment Feedback & Student Work`, `LanguageExecutorFactoryTest`, `Frontend Assignment API Client`, `User Notification Settings`, `User DTO`, `PermissionMatrixIntegrationTest.java`, `Async Config & Ownership Permission Tests`, `ExecutionTestCaseInfo`, `Group Metrics Overview`, `Assignment Controller Integration Tests`, `Assignment Service & Clone DTOs`, `Notification Email Listener`, `Assignment Update Entity`, `Assignment Entity`, `Execution Entity`, `Create Assignment Request`, `Group Service`, `AssignmentGradeDTO`, `Notification Format Service`, `AssignmentValidationStatus`, `Group Controller Integration Tests`, `Execution Request Service`, `Submission Entity`, `TestSuiteRevision`, `PasswordResetToken`, `AssignmentController.java`, `ExecutionTestCaseInfo`, `RecoveryPasswordRequest`, `.listGroupSubmissions`, `useAuth`, `CheckExecutionControllerIntegrationTest.java`, `.create`, `DisplayName`, `GroupServiceTest`, `AuthController.java`, `DisplayName`, `ExecutionTestCaseInfo`, `DisplayName`, `TestGenerationResult`, `NotificationDomainEventRouter`, `UpdatePasswordRequest`, `NotificationDomainEventRouter`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `LoginPage()` connect `ExecutionDTO` to `Assignment Feedback & Student Work`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `Assignment` connect `Assignment Entity` to `Assignment Update Requests`, `LanguageExecutorFactoryTest`, `Execution Job Queue Model`, `Frontend Assignment API Client`, `User Notification Settings`, `PermissionMatrixIntegrationTest.java`, `NotificationDomainEventRouter`, `Async Config & Ownership Permission Tests`, `Group Metrics Overview`, `Assignment Service & Clone DTOs`, `Assignment Update Entity`, `Notification Dispatch Log`, `Test Case Info (Queue)`, `Execution Entity`, `Create Assignment Request`, `Group Service`, `AssignmentGradeDTO`, `Notification Format Service`, `Reevaluation Batch`, `Execution Request Service`, `Auth Response`, `TestSuiteRevision`, `AppHeader.tsx`, `JwtUtil`, `ExecutionTestCaseInfo`, `AssignmentDTO`, `.listGroupSubmissions`, `CheckExecutionControllerIntegrationTest.java`, `.create`, `AuthController.java`, `CreateAssignmentPage.tsx`, `UpdatePasswordRequest`, `.fixture`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE` to the rest of the system?**
  _465 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Assignment Update Requests` be split into smaller, more focused modules?**
  _Cohesion score 0.07619738751814223 - nodes in this community are weakly interconnected._
- **Should `Domain Exceptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06716417910447761 - nodes in this community are weakly interconnected._
- **Should `Assignment Feedback & Student Work` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._