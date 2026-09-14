# Graph Report - CodeHive  (2026-08-18)

## Corpus Check
- 561 files · ~191,966 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4761 nodes · 11865 edges · 285 communities (198 shown, 87 thin omitted)
- Extraction: 88% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 1354 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ac7f36f`
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
- Language
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
- ComparatorType
- Core API workflow
- generate_fake_users.py
- Architecture
- AdminUserControllerIntegrationTest
- MetricsProjectionRepositoryTest
- EmailTemplateConfig.java
- codehive/config/MinioConfig.java
- OpenAPIConfig.java
- EditAssignmentPage.tsx
- @monaco-editor/react
- Programming identity
- Sliding-window test fixture guide
- DockerClientConfig.java
- worker/config/MinioConfig.java
- WorkerApplicationTests.java
- Backend CI
- AssignmentGradeDTO
- AuthServiceTest.java
- SecurityConfig.java
- .create
- ExecutionTrigger
- .toEntity
- local infrastructure services
- codehive-backend/gradlew
- CodehiveApplication
- AspectConfig.java
- CacheConfig.java
- SchedulingConfig.java
- SampleTestCaseDTO
- TeacherAssignmentPreviewPage.tsx
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
- AuthControllerIntegrationTest.java
- RevisionStatus
- UpdatePasswordRequest
- Default user avatar
- Notification email template
- Frontend feature-based architecture
- Frontend Docker Compose service
- ExecutionTrigger
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
- TestAsyncConfig.java
- EnrollmentNumberRules.java
- framer-motion
- PasswordGenerator.java
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

## God Nodes (most connected - your core abstractions)
1. `User` - 214 edges
2. `Assignment` - 190 edges
3. `UserRepository` - 103 edges
4. `Execution` - 78 edges
5. `SuccessResponse` - 74 edges
6. `Language` - 73 edges
7. `AssignmentDTO` - 71 edges
8. `EntityNotFoundException` - 71 edges
9. `AssignmentRepository` - 70 edges
10. `NotificationType` - 69 edges

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

## Communities (285 total, 87 thin omitted)

### Community 0 - "Assignment Update Requests"
Cohesion: 0.10
Nodes (3): UpdateAssignmentRequest, Query, Modifying

### Community 1 - "JWT Authentication Filter"
Cohesion: 0.15
Nodes (10): ClaimExtractionTests, EdgeCaseTests, BeforeEach, DisplayName, Nested, Test, JwtUtilTest, TokenExpirationTests (+2 more)

### Community 2 - "Sign-Up Request DTO"
Cohesion: 0.10
Nodes (9): SignUpRequest, ContentTypeTests, CsvSignUpEndpointTests, DisplayName, Nested, Test, LoginEndpointTests, SecurityTests (+1 more)

### Community 3 - "Domain Exceptions"
Cohesion: 0.08
Nodes (19): ArtifactExpiredException, InvalidJWTException, GlobalExceptionHandler, ResponseEntity, ExpiredRecoveryTokenException, InvalidRecoveryTokenException, TokenAlreadyUsedException, TokenNotFoundException (+11 more)

### Community 4 - "Assignment Feedback & Student Work"
Cohesion: 0.11
Nodes (13): AlreadyRegisteredEmailException, AlreadyRegisteredEnrollmentNumberException, IncorrectCredentialsException, AuthService, AuthResponse, MultipartFile, PasswordEncoder, Pattern (+5 more)

### Community 5 - "Execution Job Queue Model"
Cohesion: 0.23
Nodes (7): AssignmentsHonorOwnership, GroupsHonorOwnership, DisplayName, Nested, Test, MetricsHonorOwnership, StudentWorkAndGrading

### Community 6 - "Frontend Assignment API Client"
Cohesion: 0.10
Nodes (8): Entity, Table, ReferenceSolutionRevision, RevisionStatus, ACTIVE, FAILED, PROCESSING, SUPERSEDED

### Community 7 - "User Notification Settings"
Cohesion: 0.05
Nodes (31): NotificationPreferenceDTO, Entity, Table, UserNotificationPreference, NotificationType, ASSIGNMENT_CLOSE_SOON, ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION, ASSIGNMENT_DUE_SOON (+23 more)

### Community 8 - "User DTO"
Cohesion: 0.17
Nodes (10): User, DTOToEntityTests, EntityToDTOTests, DisplayName, Nested, Test, User, ListMappingTests (+2 more)

### Community 9 - "CSV Bulk Register Response"
Cohesion: 0.27
Nodes (8): ExecutionResultListener, Component, Logger, RabbitListener, ExecutionResultService, Logger, Service, Transactional

### Community 11 - "Execution Report (Queue)"
Cohesion: 0.04
Nodes (12): ExecutionReport, TestCaseResult, RecentSubmissionDTO, ExecutionStatus, AC, CE, MLE, OLE (+4 more)

### Community 12 - "Caveman-Compress Benchmark Tooling"
Cohesion: 0.08
Nodes (44): benchmark_pair(), count_tokens(), main(), print_table(), Path, main(), print_usage(), build_compress_prompt() (+36 more)

### Community 13 - "Email Template Rendering"
Cohesion: 0.09
Nodes (24): EmailTemplateRenderer, Component, TemplateEngine, RenderedEmail, Async, JavaMailSender, Logger, Service (+16 more)

### Community 14 - "C Language Executor"
Cohesion: 0.19
Nodes (6): CExecutor, Component, DockerClient, Override, CExecutorTest, Test

### Community 15 - "Async Config & Ownership Permission Tests"
Cohesion: 0.07
Nodes (9): EnrollmentDTO, EnrollmentStudentDTO, GroupDTO, JsonInclude, EnrollmentStatus, ACTIVE, LEFT, REMOVED (+1 more)

### Community 16 - "Notification Preferences"
Cohesion: 0.26
Nodes (20): teacherRequest(), archiveGroup(), createGroup(), deleteGroup(), getTeacherGroup(), groupPath(), listGroupStudents(), removeGroupStudent() (+12 more)

### Community 17 - "Admin User Controller"
Cohesion: 0.25
Nodes (17): AssignmentController, ApiResponse, ApiResponses, Authentication, DeleteMapping, GetMapping, Logger, MultipartFile (+9 more)

### Community 18 - "Group Metrics Overview"
Cohesion: 0.05
Nodes (40): GroupMetricsController, ApiResponses, Authentication, GetMapping, Operation, ResponseEntity, RestController, SuccessResponse (+32 more)

### Community 19 - "Clone Assignment Request"
Cohesion: 0.07
Nodes (4): AssignmentExampleRequest, CloneAssignmentRequest, CloneTestCaseRequest, Assignment

### Community 20 - "Language Executor Factory"
Cohesion: 0.10
Nodes (17): Component, Logger, LanguageExecutorFactory, LanguageExecutor, ExecutionReport, Logger, ObjectMapper, Service (+9 more)

### Community 21 - "Assignment Controller Integration Tests"
Cohesion: 0.22
Nodes (7): CreateAssignment, GetAssignmentById, Assignment, DisplayName, Nested, Test, ListAssignments

### Community 22 - "Assignment Service & Clone DTOs"
Cohesion: 0.10
Nodes (14): Scope, CHECK_ANALYTICS, CREATE_ADMINS, CREATE_GROUP, CREATE_USERS, MANAGE_ADMIN_STATUS, MANAGE_GROUPS, MANAGE_SCOPES (+6 more)

### Community 23 - "Output Comparator Service"
Cohesion: 0.21
Nodes (7): ExactMatch, FloatingPoint, BeforeEach, DisplayName, Nested, Test, OutputComparatorServiceTest

### Community 24 - "Notification Email Listener"
Cohesion: 0.11
Nodes (18): Component, Logger, RabbitListener, Transactional, NotificationEmailListener, Component, Logger, RabbitTemplate (+10 more)

### Community 25 - "Assignment Update Entity"
Cohesion: 0.07
Nodes (11): AssignmentUpdate, Entity, Table, AssignmentUpdateKind, METADATA, REFERENCE_ONLY, TEST_SUITE, AssignmentUpdateStatus (+3 more)

### Community 26 - "Notification Dispatch Log"
Cohesion: 0.10
Nodes (4): AssignmentExample, Entity, Table, AssignmentExampleRepository

### Community 27 - "Execution Result Model"
Cohesion: 0.10
Nodes (11): ExecutionResult, CE, ExecutionResultTest, DisplayName, Nested, Test, MLE, OLE (+3 more)

### Community 28 - "Test Case Info (Queue)"
Cohesion: 0.06
Nodes (5): TestCaseInfo, TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 29 - "Assignment Entity"
Cohesion: 0.04
Nodes (9): Assignment, Page, Query, Assignment, BeforeEach, ClassGroup, StudentAssignmentWork, User (+1 more)

### Community 30 - "Execution Entity"
Cohesion: 0.10
Nodes (9): Execution, Entity, Table, ExecutionDTO, ExecutionJob, Assignment, BeforeEach, ClassGroup (+1 more)

### Community 32 - "Frontend Protected Route & Admin Pages"
Cohesion: 0.05
Nodes (9): ProtectedRoute(), ProtectedRouteProps, AuthContextType, CreateUserPage(), ROLE_OPTIONS, CsvUploadPage(), AssignmentPage(), Role (+1 more)

### Community 33 - "Group Service"
Cohesion: 0.11
Nodes (13): AccessDeniedException, AssignmentFeedbackDTO, EntityNotFoundException, ValidationException, AssignmentFeedbackService, AssignmentFeedback, Transactional, GroupService (+5 more)

### Community 34 - "Submission DTO"
Cohesion: 0.12
Nodes (4): JsonInclude, SubmissionDTO, Submission, SubmissionMapper

### Community 35 - "Test Generation Listener"
Cohesion: 0.06
Nodes (17): Component, Logger, RabbitListener, TestGenerationRequestListener, Logger, RabbitTemplate, Service, TestGenerationResultProducer (+9 more)

### Community 36 - "Notification Format Service"
Cohesion: 0.14
Nodes (22): listTeacherGroups(), getAssignmentMetrics(), getGroupMetricsOverview(), listAssignmentMetrics(), listStudentMetrics(), percentage(), TeacherAnalyticsPage(), TeacherDashboardPage() (+14 more)

### Community 37 - "Frontend Execution API Client"
Cohesion: 0.05
Nodes (40): getAssignment(), ApiResponse, getExecution(), getExecutionReport(), listSubmissions(), AiMessage, LANGUAGE_FILE, LANGUAGE_LABELS (+32 more)

### Community 38 - "Group Controller"
Cohesion: 0.21
Nodes (17): GroupController, ApiResponse, ApiResponses, Authentication, DeleteMapping, GetMapping, Operation, PatchMapping (+9 more)

### Community 39 - "Reevaluation Batch"
Cohesion: 0.07
Nodes (11): Entity, Table, ReevaluationBatch, ReevaluationBatchStatus, COMPLETED, COMPLETED_WITH_FAILURES, DISPATCHING, PROCESSING (+3 more)

### Community 40 - "User Entity"
Cohesion: 0.12
Nodes (17): STUDENT_NAV, STUDENT_SIDEBAR_ITEMS, STUDENT_STATS_ICONS, getTeacherAssignmentPreview(), TEACHER_CREATE_NAV, TEACHER_CREATE_SIDEBAR_ITEMS, TEACHER_NAV, TEACHER_SIDEBAR_ITEMS (+9 more)

### Community 41 - "Group Controller Integration Tests"
Cohesion: 0.07
Nodes (24): AdminInitializer, Component, Logger, Override, PasswordEncoder, GroupControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc (+16 more)

### Community 42 - "Execution Request Service"
Cohesion: 0.22
Nodes (8): StudentAssignmentWork, Transactional, Assignment, BeforeEach, Assignment, Test, User, StudentAssignmentWorkServiceTest

### Community 43 - "Submission Entity"
Cohesion: 0.26
Nodes (13): ApiResponse, Authentication, GetMapping, Operation, PostMapping, PreAuthorize, RequestMapping, ResponseEntity (+5 more)

### Community 44 - "Auth Response"
Cohesion: 0.11
Nodes (10): AssignmentGradeHistory, Entity, Table, GradeChangeReason, CLEARED_MAX_POINTS_CHANGED, CLEARED_RESUBMISSION, CLEARED_TEST_SUITE_CHANGED, CREATED (+2 more)

### Community 45 - "StudentDashboardPage.tsx"
Cohesion: 0.06
Nodes (43): listAssignments(), listAssignmentsForGroups(), jsonBody(), studentRequest(), submitExecution(), getGroup(), joinGroup(), listMyGroups() (+35 more)

### Community 46 - "Scope.java"
Cohesion: 0.19
Nodes (11): ExecutionRequestProducer, Logger, RabbitTemplate, Service, ExecutionJobCreatedEvent, ExecutionRequestService, ApplicationEventPublisher, ObjectMapper (+3 more)

### Community 47 - "TestSuiteRevision"
Cohesion: 0.03
Nodes (15): AssignmentPreviewDTO, CloneAssignmentFormDTO, ExecutionJob, ComparatorType, EXACT_MATCH, FLOATING_POINT, ExecutionType, DEFINITIVE (+7 more)

### Community 48 - "useTheme"
Cohesion: 0.05
Nodes (23): getInitialTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), RecoveryPasswordPage(), ResetPasswordPage() (+15 more)

### Community 49 - "AppHeader.tsx"
Cohesion: 0.06
Nodes (16): AssignmentPreviewTestCaseDTO, CloneAssignmentTestCaseDTO, AssignmentService, Logger, MultipartFile, Page, Service, TestCaseInfo (+8 more)

### Community 50 - "PasswordResetToken"
Cohesion: 0.13
Nodes (12): Entity, Table, PasswordResetToken, PasswordResetTokenRepository, Service, Transactional, BeforeEach, ExtendWith (+4 more)

### Community 52 - "ClassGroup"
Cohesion: 0.05
Nodes (6): ClassGroup, Entity, Table, GroupEnrollment, Entity, Table

### Community 53 - ".error"
Cohesion: 0.36
Nodes (5): EnrollmentNumberRulesTest, Test, EnumSource, ParameterizedTest, ValueSource

### Community 54 - "teacher/api/assignment.api.ts"
Cohesion: 0.11
Nodes (29): cloneAssignment(), createAssignment(), deleteAssignment(), getActiveTeacherGroups(), getAssignmentUpdate(), getCloneAssignmentForm(), getTeacherAssignments(), multipartMetadata() (+21 more)

### Community 55 - "RabbitConfig"
Cohesion: 0.22
Nodes (6): Binding, Bean, Configuration, MessageConverter, RabbitConfig, DirectExchange

### Community 56 - "AssignmentController.java"
Cohesion: 0.08
Nodes (15): Entity, Table, UserNotificationSettings, UpdateNotificationPreferenceRequest, UpdateNotificationSettingsRequest, UserNotificationPreferenceRepository, UserNotificationSettingsRepository, Service (+7 more)

### Community 57 - "AssignmentFeedback"
Cohesion: 0.06
Nodes (17): AssignmentFeedback, Entity, Table, FeedbackStatus, DELETED, PUBLISHED, forRole(), getAudience() (+9 more)

### Community 58 - "UserDTO"
Cohesion: 0.15
Nodes (5): JsonInclude, UserDTO, UserMapper, AuthResponse, BeforeEach

### Community 59 - "AssignmentGradeHistory"
Cohesion: 0.23
Nodes (16): AssignmentStudentWorkController, ApiResponse, Authentication, DeleteMapping, GetMapping, Operation, PostMapping, PreAuthorize (+8 more)

### Community 60 - "auth.api.ts"
Cohesion: 0.16
Nodes (20): CsvProgressMessage, CsvTaskResponse, forgotPassword(), getMe(), login(), resetPassword(), signUp(), updatePassword() (+12 more)

### Community 61 - "RecoveryPasswordController.java"
Cohesion: 0.12
Nodes (18): ApiResponse, ApiResponses, Operation, PostMapping, RequestMapping, ResponseEntity, RestController, SecurityRequirements (+10 more)

### Community 62 - "ExecutionTestCaseInfo"
Cohesion: 0.07
Nodes (16): Component, Logger, TestGenerationResultListener, AssignmentLimits, ApplicationEventPublisher, Component, NotificationDomainEventPublisher, AssignmentUpdateService (+8 more)

### Community 64 - "CsvProgressMessage"
Cohesion: 0.09
Nodes (6): CsvProgressMessage, Status, COMPLETED, PROCESSING, ROW_ERROR, ROW_SUCCESS

### Community 65 - "GroupMetricsControllerIntegrationTest.java"
Cohesion: 0.09
Nodes (24): EnrollmentStatusCount, AssignmentGradeHistoryRepository, AssignmentGradeRepository, AssignmentRepository, ClassGroupRepository, GroupEnrollmentRepository, Query, StudentAssignmentWorkRepository (+16 more)

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
Cohesion: 0.16
Nodes (3): Entity, Table, TestCase

### Community 70 - ".buildExecutionJob"
Cohesion: 0.32
Nodes (4): StudentAssignmentWorkDTO, Service, Transactional, StudentWorkQueryService

### Community 71 - "ExecutionJob"
Cohesion: 0.09
Nodes (4): ExecutionJob, ExecutionType, DEFINITIVE, PRACTICE

### Community 72 - ".getStatus"
Cohesion: 0.26
Nodes (7): AfterAll, DisplayName, DockerClient, Tag, Test, SandboxSecurityTest, TestMethodOrder

### Community 73 - "ReevaluationService.java"
Cohesion: 0.09
Nodes (21): Assertions, Before writing tests, Boundary cases, Dependency behavior, Determine test scenarios, Execution, Existing implementation vs expected behavior, Existing tests (+13 more)

### Community 74 - "AssignmentDTO"
Cohesion: 0.05
Nodes (5): AssignmentDTO, JsonInclude, AssignmentExampleDTO, AssignmentMapper, Assignment

### Community 75 - "GroupDTO"
Cohesion: 0.26
Nodes (4): CPPExecutor, Component, DockerClient, Override

### Community 76 - "useAuth"
Cohesion: 0.12
Nodes (20): AuthContext, AuthProvider(), useAuth(), getAuthToken(), removeAuthToken(), setAuthToken(), AdminLayout(), AdminLayoutProps (+12 more)

### Community 77 - "CheckExecutionControllerIntegrationTest.java"
Cohesion: 0.12
Nodes (12): NotificationEmailContent, Component, NotificationFormatService, AssignmentNotificationStrategy, Component, Override, GroupNotificationStrategy, Component (+4 more)

### Community 78 - ".create"
Cohesion: 0.04
Nodes (20): Entity, Table, StudentAssignmentWork, Entity, Table, Submission, SubmissionStatus, SUBMITTED (+12 more)

### Community 79 - "DisplayName"
Cohesion: 0.22
Nodes (5): DisplayName, Nested, Test, ResetPasswordTests, SendPasswordResetEmailTests

### Community 80 - "GroupServiceTest"
Cohesion: 0.15
Nodes (5): UpdateUserRequest, AdminUserService, Page, Service, Transactional

### Community 81 - "TestGenerationJob"
Cohesion: 0.10
Nodes (4): TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 82 - "OutputComparatorService"
Cohesion: 0.38
Nodes (4): ComparisonResult, Logger, Service, OutputComparatorService

### Community 83 - "TeacherGroupDetailPage.tsx"
Cohesion: 0.07
Nodes (27): `ai_assistance_interactions`, `ai_assistance_usage`, `ai_data_consents`, Assignment configuration, Assignment regression tests, Assistant call, Assistant service tests, Configuration (+19 more)

### Community 84 - "AdminUserController.java"
Cohesion: 0.29
Nodes (14): AdminUserController, ApiResponses, Authentication, DeleteMapping, GetMapping, Operation, PatchMapping, PostMapping (+6 more)

### Community 85 - "ObjectStorageService"
Cohesion: 0.35
Nodes (4): SandboxConstants, DisplayName, Test, SandboxConstantsTest

### Community 86 - "AbstractLanguageExecutor"
Cohesion: 0.12
Nodes (9): AbstractLanguageExecutor, DockerClient, Logger, Override, ContainerSession, ContainerSessionTest, DisplayName, Test (+1 more)

### Community 87 - "TeacherDashboardPage.tsx"
Cohesion: 0.14
Nodes (5): Query, Scheduled, Transactional, BeforeEach, Test

### Community 88 - "Backend Controller Layer"
Cohesion: 0.12
Nodes (22): AdminUserController, AssignmentController, AuthController, CheckExecutionController, Backend Controller Layer, GlobalExceptionHandler, NotificationPreferenceController, RecoveryPasswordController (+14 more)

### Community 89 - "AuthController.java"
Cohesion: 0.26
Nodes (15): AuthController, ApiResponses, Authentication, GetMapping, MultipartFile, Operation, PostMapping, PreAuthorize (+7 more)

### Community 90 - "GroupMetricsController.java"
Cohesion: 0.40
Nodes (5): Fixture, StudentAssignmentWork, Submission, Test, SubmissionLifecycleServiceTest

### Community 91 - "ExecutionDTO"
Cohesion: 0.32
Nodes (4): AssignmentUpdateServiceTest, Assignment, Test, UpdateFixture

### Community 92 - "CreateAssignmentPage.tsx"
Cohesion: 0.08
Nodes (30): ApplicationEvents, Entity, Table, AssignmentUpdateRepository, ExecutionRepository, ReevaluationBatchRepository, ReferenceSolutionRevisionRepository, TestCaseRepository (+22 more)

### Community 93 - "DisplayName"
Cohesion: 0.24
Nodes (6): GetExecution, GetReport, DisplayName, Nested, Test, SubmitExecution

### Community 94 - "RateLimitAspect"
Cohesion: 0.19
Nodes (11): Around, Aspect, Bucket, Component, HttpServletRequest, Logger, RateLimitAspect, Service (+3 more)

### Community 95 - "DisplayName"
Cohesion: 0.26
Nodes (6): DisplayName, Nested, Test, User, LoginTests, RegistrationTests

### Community 96 - "dependencies"
Cohesion: 0.11
Nodes (19): class-variance-authority, dependencies, class-variance-authority, isbot, monaco-editor, @radix-ui/react-select, react, react-resizable-panels (+11 more)

### Community 97 - "ExecutionTestCaseInfo"
Cohesion: 0.12
Nodes (9): ExecutionStatus, AC, CE, MLE, OLE, PENDING, RTE, TLE (+1 more)

### Community 98 - "DisplayName"
Cohesion: 0.21
Nodes (7): ForgotPasswordRequest, ContentTypeTests, ForgotPasswordEndpointTests, DisplayName, Nested, Test, SecurityTests

### Community 99 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, @react-router/dev, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+11 more)

### Community 101 - "Sequence Diagram Specifications: Groups, Assignments, Submissions, Grades, Feedback"
Cohesion: 0.11
Nodes (19): AssignmentController (sequence spec), AssignmentFeedbackService (sequence spec), AssignmentGradeService (sequence spec), AssignmentService (sequence spec), AssignmentStudentWorkController (sequence spec), CheckExecutionController (sequence spec), Flow 3: Create assignment, Flow 4: Create submission and evaluate it (+11 more)

### Community 102 - "caveman"
Cohesion: 0.11
Nodes (18): cavecrew, cavecrew delegation matrix, cavecrew-builder, cavecrew-investigator, cavecrew-reviewer, caveman-commit, Conventional Commits, caveman-compress (+10 more)

### Community 104 - "AdminUserControllerIntegrationTest"
Cohesion: 0.23
Nodes (5): Claims, ExpiredJWTException, Component, JwtUtil, SecretKey

### Community 106 - "AuthControllerIntegrationTest.java"
Cohesion: 0.08
Nodes (6): AssignmentGrade, Entity, Table, GradeStatus, DRAFT, RETURNED

### Community 107 - "MockMultipartFile"
Cohesion: 0.04
Nodes (24): Entity, Override, Table, User, Role, ADMIN, STUDENT, TEACHER (+16 more)

### Community 108 - "CsvProgressWebSocketHandler"
Cohesion: 0.23
Nodes (10): CloseStatus, CsvProgressWebSocketHandler, Component, Logger, ObjectMapper, Override, PreDestroy, TextMessage (+2 more)

### Community 109 - "CheckExecutionController.java"
Cohesion: 0.29
Nodes (11): CheckExecutionController, ApiResponses, Authentication, GetMapping, Operation, PostMapping, RequestMapping, ResponseEntity (+3 more)

### Community 110 - "SubmissionController.java"
Cohesion: 0.23
Nodes (8): CsvRegistrationService, Async, Logger, PasswordEncoder, Pattern, Service, CSVRecord, ObjectProvider

### Community 111 - "LandingPage.tsx"
Cohesion: 0.17
Nodes (8): Features, Footer(), footerLinks, socialLinks, Hero(), HowItWorks(), steps, LandingPage()

### Community 112 - "NotificationDomainEventRouter"
Cohesion: 0.28
Nodes (5): fromValue(), TestSuiteUpdateMode, APPEND, REPLACE_ALL, JsonCreator

### Community 113 - "Backend Model Implementation"
Cohesion: 0.15
Nodes (16): M6 verdictDistribution, Assignment entity, AssignmentUpdate entity, ClassGroup entity, CreateAssignmentRequest, Backend Model Implementation, Execution entity, ExecutionJob (queue DTO) (+8 more)

### Community 114 - "PythonExecutor"
Cohesion: 0.21
Nodes (5): BeforeAll, Component, DockerClient, Override, PythonExecutor

### Community 115 - "CsvRegistrationService"
Cohesion: 0.09
Nodes (3): ExecutionDTO, JsonInclude, ExecutionMapper

### Community 116 - "AssignmentRepository"
Cohesion: 0.25
Nodes (13): ApiResponse, Authentication, GetMapping, Operation, PostMapping, PutMapping, RequestMapping, ResponseEntity (+5 more)

### Community 117 - "Métricas de desempeño para el docente"
Cohesion: 0.13
Nodes (15): Métricas de desempeño para el docente, M10 missingCount / missingStudents, M11 gradingProgress, M12 enrollment summary, M1 submissionRate, M2 averageScore per assignment, M3 averageScore per student, M5 averageDeliveryMarginHours (+7 more)

### Community 118 - "Teacher Frontend"
Cohesion: 0.25
Nodes (11): assignment.api.ts (teacher feature API module), /teacher/assignments/:assignmentId/clone route, Clone flow never inherits source scheduling dates, /teacher/create-assignment route, Teacher Frontend, /teacher/assignments route, /teacher dashboard route, Frontend Routes Implementation (+3 more)

### Community 119 - "UpdatePasswordRequest"
Cohesion: 0.11
Nodes (10): AdminDashboardPage(), NAV_CARDS, STATS, DashboardLayoutProps, STUDENT_NAV, TEACHER_NAV, TeacherLayoutProps, AppHeader() (+2 more)

### Community 123 - "Rule 11: group-owner authorization parity across controllers"
Cohesion: 0.17
Nodes (12): Query: Is group student list visible only to teacher?, Finding: only group-owning teacher could originally list students, Query: extend roster visibility to enrolled students, Finding: requireStudentListAccess() authorizes owner or active enrollment, list-only, AssignmentController (groups doc), AssignmentStudentWorkController (groups doc), GroupController (groups doc), GroupMetricsController (+4 more)

### Community 124 - "AGENTS.md - CodeHive Root Instructions"
Cohesion: 0.18
Nodes (12): codehive-backend (Spring Boot REST API, Java 21), codehive-frontend (React Router v7 SPA, TypeScript), codehive_queue (backend to worker execution jobs), codehive_result_queue (worker to backend execution results), codehive_test_generation_queue (backend to worker), codehive-worker (Spring Boot sandbox executor, Java 21), utils/ObjectKeyBuilder, AGENTS.md - CodeHive Root Instructions (+4 more)

### Community 125 - "RecoveryPasswordControllerIntegrationTest.java"
Cohesion: 0.29
Nodes (10): ActiveProfiles, AutoConfigureMockMvc, BeforeEach, MockMvc, ObjectMapper, PasswordEncoder, SpringBootTest, Transactional (+2 more)

### Community 126 - "Language"
Cohesion: 0.17
Nodes (5): Language, C, CPP, JAVA, PYTHON

### Community 127 - "NotificationDomainEventRouter"
Cohesion: 0.14
Nodes (7): Entity, Table, NotificationDispatchLog, Service, Transactional, NotificationDispatchService, NotificationDispatchLogRepository

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

### Community 133 - "CsvBulkRegisterResponse"
Cohesion: 0.20
Nodes (18): jsonRequest(), assignmentPath(), createFeedback(), deleteFeedback(), getStudentWork(), listFeedback(), listStudentWork(), returnGrade() (+10 more)

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
Cohesion: 0.19
Nodes (13): Logger, RabbitTemplate, Service, TestGenerationRequestProducer, ActiveProfiles, Assignment, AutoConfigureMockMvc, Import (+5 more)

### Community 140 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, start, typecheck, type

### Community 141 - "NotificationDomainEventRouter"
Cohesion: 0.35
Nodes (5): NotificationDomainEvent, Component, Transactional, TransactionalEventListener, NotificationDomainEventRouter

### Community 142 - "Grupos, tareas y entregas"
Cohesion: 0.21
Nodes (12): CloneAssignmentRequest, Query: expected frontend behavior when an assignment is cloned, Finding: clone requires group+dates only; graph lacked frontend clone node at the time, Assignment (groups doc), AssignmentFeedback (groups doc), AssignmentGrade (groups doc), ClassGroup, Grupos, tareas y entregas (+4 more)

### Community 146 - "ComparatorType"
Cohesion: 0.25
Nodes (3): ComparatorType, EXACT_MATCH, FLOATING_POINT

### Community 147 - "Core API workflow"
Cohesion: 0.32
Nodes (8): Assignment creation examples, Assignment updates and evaluation workflow, Staged assignment update, Core API workflow, Definitive submission, Practice execution, Negative and boundary scenarios, Manual API testing guide

### Community 148 - "generate_fake_users.py"
Cohesion: 0.52
Nodes (6): generate_email(), generate_enrollment_number(), generate_users(), main(), random_last_name(), random_name()

### Community 149 - "Architecture"
Cohesion: 0.14
Nodes (12): Architecture, Backend (`codehive-backend/`), Backend key flows, Commands, Custom Docker execution images, Frontend (`codehive-frontend/`), Frontend structure, Infrastructure env vars (+4 more)

### Community 150 - "AdminUserControllerIntegrationTest"
Cohesion: 0.21
Nodes (10): AdminUserControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, MockMvc, PasswordEncoder, SpringBootTest, Test (+2 more)

### Community 151 - "MetricsProjectionRepositoryTest"
Cohesion: 0.16
Nodes (13): Component, HttpServletRequest, Logger, Override, JWTAuthenticationFilter, Override, Service, UserDetails (+5 more)

### Community 152 - "EmailTemplateConfig.java"
Cohesion: 0.53
Nodes (4): EmailTemplateConfig, Bean, Configuration, TemplateEngine

### Community 153 - "codehive/config/MinioConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, MinioClient, MinioConfig

### Community 154 - "OpenAPIConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, OpenAPIConfig, OpenAPI

### Community 155 - "EditAssignmentPage.tsx"
Cohesion: 0.15
Nodes (12): getTeacherAssignment(), getTeacherAssignmentPage(), normalizeAssignment(), byteSize(), currentMinimumDate(), EditableTestCase, EditAssignmentPage(), EXT_TO_LANG (+4 more)

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
Cohesion: 0.26
Nodes (5): AssignmentGradeDTO, AssignmentGradeService, Service, Transactional, Test

### Community 164 - "AuthServiceTest.java"
Cohesion: 0.16
Nodes (8): CsvBulkRegisterResponse, JsonInclude, AuthServiceTest, BeforeEach, ExtendWith, LoginRequest, PasswordEncoder, SignUpRequest

### Community 165 - "SecurityConfig.java"
Cohesion: 0.29
Nodes (10): AuthenticationManager, AuthenticationProvider, Bean, Configuration, PasswordEncoder, SecurityConfig, EnableMethodSecurity, EnableWebSecurity (+2 more)

### Community 167 - "ExecutionTrigger"
Cohesion: 0.07
Nodes (15): RabbitListener, Transactional, Entity, Table, TestSuiteRevision, Assignment, BeforeEach, User (+7 more)

### Community 168 - ".toEntity"
Cohesion: 0.23
Nodes (13): AssignmentControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, ClassGroup, EntityManager, Import, MockMvc (+5 more)

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

### Community 176 - "TeacherAssignmentPreviewPage.tsx"
Cohesion: 0.26
Nodes (4): Component, DockerClient, Override, JavaExecutor

### Community 180 - "codehive-worker/gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 183 - "Welcome email template"
Cohesion: 1.00
Nodes (3): Welcome email template, Plain-text welcome template, Backend authentication model

### Community 200 - "AuthControllerIntegrationTest.java"
Cohesion: 0.24
Nodes (11): AuthControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, Import, MockMvc, ObjectMapper, PasswordEncoder (+3 more)

### Community 207 - "ExecutionTrigger"
Cohesion: 0.25
Nodes (5): ExecutionTrigger, ASSIGNMENT_UPDATE, INITIAL_SUBMISSION, MANUAL_RETRY, PRACTICE

### Community 209 - "WebSocketConfig"
Cohesion: 0.33
Nodes (6): Configuration, Override, WebSocketConfig, EnableWebSocket, WebSocketConfigurer, WebSocketHandlerRegistry

### Community 244 - "AsyncConfig.java"
Cohesion: 0.46
Nodes (5): AsyncConfig, Bean, Configuration, EnableAsync, ThreadPoolTaskExecutor

### Community 246 - "TestAsyncConfig.java"
Cohesion: 0.47
Nodes (4): AsyncConfigurer, Override, TestConfiguration, TestAsyncConfig

## Knowledge Gaps
- **450 isolated node(s):** `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE`, `VALIDATING`, `APPLIED` (+445 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **87 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `.students()` (2× useful, score=1.418884937)
- `.listStudents()` (2× useful, score=1.418884937) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `MockMultipartFile` to `Assignment Feedback & Student Work`, `User Notification Settings`, `User DTO`, `PermissionMatrixIntegrationTest.java`, `NotificationDomainEventRouter`, `Group Metrics Overview`, `Assignment Service & Clone DTOs`, `AdminUserControllerIntegrationTest`, `Notification Email Listener`, `Assignment Update Entity`, `Assignment Entity`, `Execution Entity`, `Create Assignment Request`, `Group Service`, `AssignmentGradeDTO`, `AuthServiceTest.java`, `.toEntity`, `Group Controller Integration Tests`, `Execution Request Service`, `Auth Response`, `Scope.java`, `TestSuiteRevision`, `AppHeader.tsx`, `PasswordResetToken`, `ClassGroup`, `AssignmentController.java`, `AssignmentFeedback`, `UserDTO`, `ExecutionTestCaseInfo`, `RecoveryPasswordRequest`, `GroupMetricsControllerIntegrationTest.java`, `.buildExecutionJob`, `AuthControllerIntegrationTest.java`, `CheckExecutionControllerIntegrationTest.java`, `.create`, `DisplayName`, `GroupServiceTest`, `CreateAssignmentPage.tsx`, `DisplayName`, `AuthControllerIntegrationTest.java`, `RecoveryPasswordControllerIntegrationTest.java`, `NotificationDomainEventRouter`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `LoginPage()` connect `useAuth` to `useTheme`, `Assignment Feedback & Student Work`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `Assignment` connect `Assignment Entity` to `Assignment Update Requests`, `Frontend Assignment API Client`, `User Notification Settings`, `PermissionMatrixIntegrationTest.java`, `Group Metrics Overview`, `Clone Assignment Request`, `Assignment Controller Integration Tests`, `Assignment Update Entity`, `Notification Dispatch Log`, `Execution Entity`, `Create Assignment Request`, `Group Service`, `AssignmentGradeDTO`, `ExecutionTrigger`, `Reevaluation Batch`, `.toEntity`, `Execution Request Service`, `Scope.java`, `TestSuiteRevision`, `AppHeader.tsx`, `ClassGroup`, `AssignmentFeedback`, `ExecutionTestCaseInfo`, `GroupMetricsControllerIntegrationTest.java`, `NotificationPreferenceController.java`, `.buildExecutionJob`, `AssignmentDTO`, `CheckExecutionControllerIntegrationTest.java`, `.create`, `TeacherDashboardPage.tsx`, `ExecutionDTO`, `CreateAssignmentPage.tsx`, `MockMultipartFile`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE` to the rest of the system?**
  _450 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Assignment Update Requests` be split into smaller, more focused modules?**
  _Cohesion score 0.09725158562367865 - nodes in this community are weakly interconnected._
- **Should `Sign-Up Request DTO` be split into smaller, more focused modules?**
  _Cohesion score 0.10448979591836735 - nodes in this community are weakly interconnected._
- **Should `Domain Exceptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07615018508725542 - nodes in this community are weakly interconnected._