# Graph Report - CodeHive  (2026-08-12)

## Corpus Check
- 534 files · ~177,942 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4561 nodes · 11188 edges · 266 communities (188 shown, 78 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 1211 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e4eae6a8`
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
- AssignmentGrade
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
- Scope
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
- .create
- DisplayName
- GroupServiceTest
- TestGenerationJob
- GlobalExceptionHandler.java
- TeacherGroupDetailPage.tsx
- AdminUserController.java
- MetricsProjectionRepositoryTest
- AbstractLanguageExecutor
- TeacherDashboardPage.tsx
- Backend Controller Layer
- AuthController.java
- GroupMetricsController.java
- ExecutionDTO
- CreateAssignmentPage.tsx
- DisplayName
- RateLimitAspect
- ContainerSession
- dependencies
- ExecutionTestCaseInfo
- DisplayName
- devDependencies
- ExecutionTestCaseInfo
- Sequence Diagram Specifications: Groups, Assignments, Submissions, Grades, Feedback
- caveman
- SecurityConfig.java
- AdminUserControllerIntegrationTest
- TestGenerationResult
- TestCaseResult
- MockMultipartFile
- CsvProgressWebSocketHandler
- CheckExecutionController.java
- SubmissionController.java
- LandingPage.tsx
- ExecutionResultProducer
- Backend Model Implementation
- PythonExecutor
- CsvRegistrationService
- AssignmentRepository
- Métricas de desempeño para el docente
- Teacher Frontend
- ExecutionResultService.java
- AssignmentExampleDTO
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
- ComparatorType
- SampleTestCaseDTO
- ExecutionStatus
- PageResponse
- OpenApiCoverageIntegrationTest.java
- Late-submission reconciliation on due-date change
- TestExecutionService
- WebSocketConfig
- package.json
- ObjectStorageService
- Grupos, tareas y entregas
- ComparatorType
- Core API workflow
- generate_fake_users.py
- Architecture
- EmailTemplateConfig.java
- codehive/config/MinioConfig.java
- OpenAPIConfig.java
- metrics.types.ts
- Programming identity
- Sliding-window test fixture guide
- DockerClientConfig.java
- worker/config/MinioConfig.java
- WorkerApplicationTests.java
- Backend CI
- DisplayName
- local infrastructure services
- codehive-backend/gradlew
- CodehiveApplication
- AspectConfig.java
- CacheConfig.java
- SchedulingConfig.java
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
- clsx
- Default user avatar
- Notification email template
- Frontend feature-based architecture
- Frontend Docker Compose service
- framer-motion
- lucide-react
- @monaco-editor/react
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
- ExecutionJob
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
2. `Assignment` - 181 edges
3. `UserRepository` - 98 edges
4. `SuccessResponse` - 71 edges
5. `AssignmentDTO` - 70 edges
6. `Language` - 69 edges
7. `NotificationType` - 69 edges
8. `EntityNotFoundException` - 67 edges
9. `Execution` - 65 edges
10. `ClassGroup` - 64 edges

## Surprising Connections (you probably didn't know these)
- `Late-submission reconciliation on due-date change` --semantically_similar_to--> `Finding: AssignmentUpdateService now reconciles late flags and rejects past dates`  [INFERRED] [semantically similar]
  llms/backend/groups/README.md → graphify-out/memory/query_20260729_050038_update_teacher_due_date_flow_so_qualifying_late_su.md
- `Null vs zero distinction for metrics without data` --semantically_similar_to--> `Grupos, tareas y entregas`  [INFERRED] [semantically similar]
  llms/backend/metrics/README.md → llms/backend/groups/README.md
- `Backend CI` --conceptually_related_to--> `pull request template`  [INFERRED]
  .github/workflows/backend-ci.yml → PR_template.md
- `asynchronous execution pipeline` --references--> `local infrastructure services`  [INFERRED]
  README.md → codehive-backend/docker-compose.yaml
- `Backend authentication model` --references--> `Plain-text welcome template`  [INFERRED]
  llms/backend/auth/README.md → codehive-backend/src/main/resources/templates/email/text/welcome.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Definitive submission creation and evaluation call chain** — docs_diagrams_sequence_diagram_flows_checkexecutioncontroller, docs_diagrams_sequence_diagram_flows_executionrequestservice, docs_diagrams_sequence_diagram_flows_executionresultservice, llms_backend_service_readme_objectstorageservice [EXTRACTED 1.00]
- **Controllers unified under group-owner authorization (rule 11)** — llms_backend_groups_readme_groupcontroller, llms_backend_groups_readme_groupmetricscontroller, llms_backend_groups_readme_assignmentcontroller, llms_backend_groups_readme_assignmentstudentworkcontroller [EXTRACTED 1.00]
- **Metrics composing the group overview endpoint response** — llms_backend_metrics_readme_m1_submissionrate, llms_backend_metrics_readme_m4_ontimerate, llms_backend_metrics_readme_m11_gradingprogress, llms_backend_metrics_readme_m12_enrollment [EXTRACTED 1.00]

## Communities (266 total, 78 thin omitted)

### Community 0 - "Assignment Update Requests"
Cohesion: 0.07
Nodes (8): TestSuiteUpdateMode, APPEND, REPLACE_ALL, UpdateAssignmentRequest, AssignmentUpdateServiceTest, Assignment, Test, UpdateFixture

### Community 1 - "JWT Authentication Filter"
Cohesion: 0.15
Nodes (10): ClaimExtractionTests, EdgeCaseTests, BeforeEach, DisplayName, Nested, Test, JwtUtilTest, TokenExpirationTests (+2 more)

### Community 2 - "Sign-Up Request DTO"
Cohesion: 0.07
Nodes (22): SignUpRequest, UpdatePasswordRequest, AuthControllerIntegrationTest, ContentTypeTests, CsvSignUpEndpointTests, ActiveProfiles, AutoConfigureMockMvc, BeforeEach (+14 more)

### Community 3 - "Domain Exceptions"
Cohesion: 0.07
Nodes (21): ArtifactExpiredException, AlreadyRegisteredEmailException, ExpiredJWTException, InvalidJWTException, GlobalExceptionHandler, ResponseEntity, ExpiredRecoveryTokenException, InvalidRecoveryTokenException (+13 more)

### Community 4 - "Assignment Feedback & Student Work"
Cohesion: 0.13
Nodes (20): AssignmentStudentWorkController, ApiResponse, Authentication, DeleteMapping, GetMapping, Operation, PostMapping, PreAuthorize (+12 more)

### Community 5 - "Execution Job Queue Model"
Cohesion: 0.05
Nodes (6): ExecutionDTO, JsonInclude, ExecutionType, DEFINITIVE, PRACTICE, ExecutionRequest

### Community 6 - "Frontend Assignment API Client"
Cohesion: 0.15
Nodes (13): STUDENT_NAV, STUDENT_SIDEBAR_ITEMS, STUDENT_STATS_ICONS, TEACHER_CREATE_NAV, TEACHER_CREATE_SIDEBAR_ITEMS, TEACHER_NAV, TEACHER_SIDEBAR_ITEMS, CreateGroupPage() (+5 more)

### Community 7 - "User Notification Settings"
Cohesion: 0.07
Nodes (6): Entity, Table, UserNotificationPreference, Entity, Table, UserNotificationSettings

### Community 8 - "User DTO"
Cohesion: 0.12
Nodes (13): UserDTO, User, UserMapper, DTOToEntityTests, EntityToDTOTests, BeforeEach, DisplayName, Nested (+5 more)

### Community 9 - "CSV Bulk Register Response"
Cohesion: 0.14
Nodes (14): UpdateNotificationPreferenceRequest, UpdateNotificationSettingsRequest, UserNotificationPreferenceRepository, UserNotificationSettingsRepository, UserRepository, Service, BeforeEach, ExtendWith (+6 more)

### Community 10 - "Execution Report Model"
Cohesion: 0.05
Nodes (11): ExecutionReport, TestCaseResult, ExecutionStatus, AC, CE, MLE, OLE, PENDING (+3 more)

### Community 11 - "Execution Report (Queue)"
Cohesion: 0.04
Nodes (11): ExecutionReport, TestCaseResult, ExecutionStatus, AC, CE, MLE, OLE, PENDING (+3 more)

### Community 12 - "Caveman-Compress Benchmark Tooling"
Cohesion: 0.08
Nodes (44): benchmark_pair(), count_tokens(), main(), print_table(), Path, main(), print_usage(), build_compress_prompt() (+36 more)

### Community 13 - "Email Template Rendering"
Cohesion: 0.08
Nodes (25): EmailTemplateRenderer, Component, TemplateEngine, RenderedEmail, NotificationEmailContent, Async, JavaMailSender, Logger (+17 more)

### Community 14 - "C Language Executor"
Cohesion: 0.12
Nodes (8): CExecutor, Component, DockerClient, Override, CPPExecutor, Component, DockerClient, Override

### Community 15 - "Async Config & Ownership Permission Tests"
Cohesion: 0.09
Nodes (23): AsyncConfigurer, MinioClient, Service, ObjectStorageService, Override, TestConfiguration, TestAsyncConfig, AssignmentsHonorOwnership (+15 more)

### Community 16 - "Notification Preferences"
Cohesion: 0.06
Nodes (31): NotificationPreferenceDTO, forRole(), getAudience(), NotificationType, ASSIGNMENT_CLOSE_SOON, ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION, ASSIGNMENT_DUE_SOON, ASSIGNMENT_DUE_SOON_NO_SUBMISSION (+23 more)

### Community 17 - "Admin User Controller"
Cohesion: 0.11
Nodes (7): AlreadyRegisteredEnrollmentNumberException, UpdateUserRequest, Scope, AdminUserService, Page, Service, Transactional

### Community 18 - "Group Metrics Overview"
Cohesion: 0.09
Nodes (24): AcceptedPerformance, AssignmentMetricsDetailDTO, GradeSummary, StudentBreakdown, StudentRef, AssignmentMetricsDTO, CurrentSubmissionRow, AssignmentBreakdown (+16 more)

### Community 19 - "Clone Assignment Request"
Cohesion: 0.07
Nodes (5): AssignmentExampleRequest, CloneAssignmentRequest, CloneTestCaseRequest, Assignment, TestCaseInfo

### Community 20 - "Language Executor Factory"
Cohesion: 0.10
Nodes (17): Component, Logger, LanguageExecutorFactory, LanguageExecutor, ExecutionReport, Logger, ObjectMapper, Service (+9 more)

### Community 21 - "Assignment Controller Integration Tests"
Cohesion: 0.06
Nodes (37): LoginRequest, CsvBulkRegisterResponse, JsonInclude, AssignmentControllerIntegrationTest, CreateAssignment, GetAssignmentById, ActiveProfiles, Assignment (+29 more)

### Community 22 - "Assignment Service & Clone DTOs"
Cohesion: 0.11
Nodes (12): CloneAssignmentTestCaseDTO, AssignmentService, Logger, Page, Service, Transactional, AssignmentServiceTest, Assignment (+4 more)

### Community 23 - "Output Comparator Service"
Cohesion: 0.15
Nodes (11): ComparisonResult, Logger, Service, OutputComparatorService, ExactMatch, FloatingPoint, BeforeEach, DisplayName (+3 more)

### Community 24 - "Notification Email Listener"
Cohesion: 0.12
Nodes (18): Component, Logger, RabbitListener, Transactional, NotificationEmailListener, Component, Logger, RabbitTemplate (+10 more)

### Community 25 - "Assignment Update Entity"
Cohesion: 0.05
Nodes (30): Component, Logger, RabbitListener, TestGenerationResultListener, Logger, RabbitTemplate, Service, TestGenerationRequestProducer (+22 more)

### Community 26 - "Notification Dispatch Log"
Cohesion: 0.13
Nodes (7): Entity, Table, NotificationDispatchLog, Service, Transactional, NotificationDispatchService, NotificationDispatchLogRepository

### Community 27 - "Execution Result Model"
Cohesion: 0.11
Nodes (11): ExecutionResult, CE, ExecutionResultTest, DisplayName, Nested, Test, MLE, OLE (+3 more)

### Community 28 - "Test Case Info (Queue)"
Cohesion: 0.06
Nodes (5): TestCaseInfo, TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 29 - "Assignment Entity"
Cohesion: 0.03
Nodes (18): Assignment, Entity, Table, AssignmentExample, Entity, Table, AssignmentValidationStatus, FAILED (+10 more)

### Community 30 - "Execution Entity"
Cohesion: 0.06
Nodes (17): Execution, Entity, Table, ExecutionTrigger, ASSIGNMENT_UPDATE, INITIAL_SUBMISSION, MANUAL_RETRY, PRACTICE (+9 more)

### Community 32 - "Frontend Protected Route & Admin Pages"
Cohesion: 0.08
Nodes (8): ProtectedRoute(), ProtectedRouteProps, AuthContext, AuthContextType, AssignmentPage(), Role, Scope, User

### Community 33 - "Group Service"
Cohesion: 0.15
Nodes (7): AccessDeniedException, EntityNotFoundException, ValidationException, GroupService, SecureRandom, Service, Transactional

### Community 34 - "Submission DTO"
Cohesion: 0.06
Nodes (14): JsonInclude, SubmissionDTO, Entity, Table, Submission, SubmissionStatus, SUBMITTED, SUPERSEDED (+6 more)

### Community 35 - "Test Generation Listener"
Cohesion: 0.08
Nodes (13): Component, Logger, RabbitListener, TestGenerationRequestListener, Logger, RabbitTemplate, Service, TestGenerationResultProducer (+5 more)

### Community 36 - "Notification Format Service"
Cohesion: 0.22
Nodes (5): Component, NotificationFormatService, GroupNotificationStrategy, Component, Override

### Community 37 - "Frontend Execution API Client"
Cohesion: 0.05
Nodes (46): ApiResponse, authHeaders(), getAssignment(), listAssignments(), parseResponse(), ApiResponse, authHeaders(), getExecution() (+38 more)

### Community 38 - "Group Controller"
Cohesion: 0.19
Nodes (18): GroupController, ApiResponse, ApiResponses, Authentication, DeleteMapping, GetMapping, Operation, PatchMapping (+10 more)

### Community 39 - "Reevaluation Batch"
Cohesion: 0.07
Nodes (18): Entity, Table, ReevaluationBatch, ReevaluationBatchStatus, COMPLETED, COMPLETED_WITH_FAILURES, DISPATCHING, PROCESSING (+10 more)

### Community 40 - "User Entity"
Cohesion: 0.05
Nodes (11): Entity, Override, Table, User, Role, ADMIN, STUDENT, TEACHER (+3 more)

### Community 41 - "Group Controller Integration Tests"
Cohesion: 0.14
Nodes (12): GroupControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, DisplayName, MockMvc, ObjectMapper, PasswordEncoder (+4 more)

### Community 42 - "Execution Request Service"
Cohesion: 0.17
Nodes (13): ExecutionRequestProducer, Logger, RabbitTemplate, Service, GroupEnrollmentRepository, ExecutionRequestService, ApplicationEventPublisher, ObjectMapper (+5 more)

### Community 43 - "Submission Entity"
Cohesion: 0.12
Nodes (18): ApiResponse, Authentication, Operation, PostMapping, RequestMapping, ResponseEntity, RestController, SuccessResponse (+10 more)

### Community 44 - "Auth Response"
Cohesion: 0.14
Nodes (12): IncorrectCredentialsException, AuthService, AuthResponse, MultipartFile, PasswordEncoder, Pattern, Service, Transactional (+4 more)

### Community 45 - "StudentDashboardPage.tsx"
Cohesion: 0.12
Nodes (14): getGroups(), AssignmentRow(), FilterTab, formatDue(), getGreeting(), getSemesterBadge(), GROUP_BADGE_COLORS, LANG_ABBR (+6 more)

### Community 46 - "Scope.java"
Cohesion: 0.14
Nodes (12): AdminInitializer, Component, Logger, Override, PasswordEncoder, Test, UserAuthoritiesTest, DataJpaTest (+4 more)

### Community 47 - "TestSuiteRevision"
Cohesion: 0.05
Nodes (18): Transactional, Entity, Table, ReferenceSolutionRevision, Entity, Table, TestSuiteRevision, RevisionStatus (+10 more)

### Community 48 - "useTheme"
Cohesion: 0.08
Nodes (17): AuthProvider(), getInitialTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), removeAuthToken() (+9 more)

### Community 49 - "AssignmentGrade"
Cohesion: 0.10
Nodes (6): AssignmentGrade, Entity, Table, GradeStatus, DRAFT, RETURNED

### Community 50 - "PasswordResetToken"
Cohesion: 0.15
Nodes (9): Entity, Table, PasswordResetToken, PasswordResetTokenRepository, PasswordEncoder, Service, Transactional, RecoveryPasswordService (+1 more)

### Community 51 - "JwtUtil"
Cohesion: 0.16
Nodes (13): Component, HttpServletRequest, Logger, Override, JWTAuthenticationFilter, Override, Service, UserDetails (+5 more)

### Community 52 - "ClassGroup"
Cohesion: 0.05
Nodes (6): ClassGroup, Entity, Table, GroupEnrollment, Entity, Table

### Community 53 - ".error"
Cohesion: 0.23
Nodes (7): EnrollmentNumberRules, Pattern, EnrollmentNumberRulesTest, Test, EnumSource, ParameterizedTest, ValueSource

### Community 54 - "teacher/api/assignment.api.ts"
Cohesion: 0.12
Nodes (19): createAssignment(), deleteAssignment(), getAssignmentUpdate(), getTeacherAssignment(), getTeacherAssignmentPage(), getTeacherAssignments(), multipartMetadata(), multipartRequest() (+11 more)

### Community 55 - "RabbitConfig"
Cohesion: 0.22
Nodes (6): Binding, Bean, Configuration, MessageConverter, RabbitConfig, DirectExchange

### Community 56 - "AssignmentController.java"
Cohesion: 0.26
Nodes (16): AssignmentController, ApiResponse, ApiResponses, Authentication, DeleteMapping, GetMapping, Logger, MultipartFile (+8 more)

### Community 57 - "AssignmentFeedback"
Cohesion: 0.07
Nodes (19): AssignmentFeedbackDTO, AssignmentFeedback, Entity, Table, FeedbackStatus, DELETED, PUBLISHED, AssignmentFeedbackRepository (+11 more)

### Community 59 - "AssignmentGradeHistory"
Cohesion: 0.10
Nodes (10): AssignmentGradeHistory, Entity, Table, GradeChangeReason, CLEARED_MAX_POINTS_CHANGED, CLEARED_RESUBMISSION, CLEARED_TEST_SUITE_CHANGED, CREATED (+2 more)

### Community 60 - "auth.api.ts"
Cohesion: 0.15
Nodes (20): CsvUploadPage(), CsvProgressMessage, CsvTaskResponse, forgotPassword(), getMe(), login(), resetPassword(), signUp() (+12 more)

### Community 61 - "RecoveryPasswordController.java"
Cohesion: 0.14
Nodes (16): ApiResponse, ApiResponses, Operation, PostMapping, RequestMapping, ResponseEntity, RestController, SecurityRequirements (+8 more)

### Community 62 - "Scope"
Cohesion: 0.09
Nodes (15): JsonInclude, Scope, CHECK_ANALYTICS, CREATE_ADMINS, CREATE_GROUP, CREATE_USERS, MANAGE_ADMIN_STATUS, MANAGE_GROUPS (+7 more)

### Community 63 - "RecoveryPasswordRequest"
Cohesion: 0.33
Nodes (3): RecoveryPasswordRequest, ResetPasswordEndpointTests, User

### Community 64 - "CsvProgressMessage"
Cohesion: 0.09
Nodes (6): CsvProgressMessage, Status, COMPLETED, PROCESSING, ROW_ERROR, ROW_SUCCESS

### Community 65 - "GroupMetricsControllerIntegrationTest.java"
Cohesion: 0.15
Nodes (13): GroupMetricsControllerIntegrationTest, ActiveProfiles, Assignment, AutoConfigureMockMvc, BeforeEach, ClassGroup, DisplayName, MockMvc (+5 more)

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
Cohesion: 0.17
Nodes (14): ApiResponse, Authentication, GetMapping, Operation, PostMapping, PutMapping, RequestMapping, ResponseEntity (+6 more)

### Community 70 - ".buildExecutionJob"
Cohesion: 0.08
Nodes (10): Entity, Table, TestCase, TestCaseInfo, ExecutionJob, ExecutionTestCaseInfo, ExecutionTestCaseInfo, ObjectKeyBuilder (+2 more)

### Community 71 - "ExecutionJob"
Cohesion: 0.09
Nodes (4): ExecutionJob, ExecutionType, DEFINITIVE, PRACTICE

### Community 72 - ".getStatus"
Cohesion: 0.28
Nodes (7): AfterAll, DisplayName, DockerClient, Tag, Test, SandboxSecurityTest, TestMethodOrder

### Community 73 - "ReevaluationService.java"
Cohesion: 0.09
Nodes (21): Assertions, Before writing tests, Boundary cases, Dependency behavior, Determine test scenarios, Execution, Existing implementation vs expected behavior, Existing tests (+13 more)

### Community 74 - "AssignmentDTO"
Cohesion: 0.13
Nodes (3): AssignmentDTO, JsonInclude, Assignment

### Community 75 - "GroupDTO"
Cohesion: 0.07
Nodes (11): EnrollmentDTO, EnrollmentStudentDTO, GroupDTO, JsonInclude, EnrollmentStatusCount, EnrollmentStatus, ACTIVE, LEFT (+3 more)

### Community 76 - "useAuth"
Cohesion: 0.08
Nodes (22): useAuth(), AdminLayout(), AdminLayoutProps, NAV_ITEMS, AdminDashboardPage(), NAV_CARDS, STATS, CreateUserPage() (+14 more)

### Community 78 - ".create"
Cohesion: 0.33
Nodes (5): StudentAssignmentWork, Assignment, Test, User, StudentAssignmentWorkServiceTest

### Community 79 - "DisplayName"
Cohesion: 0.21
Nodes (9): BeforeEach, DisplayName, ExtendWith, Nested, PasswordEncoder, Test, RecoveryPasswordServiceTest, ResetPasswordTests (+1 more)

### Community 80 - "GroupServiceTest"
Cohesion: 0.10
Nodes (8): CreateGroupRequest, ClassGroupRepository, ClassGroup, GroupServiceTest, BeforeEach, ClassGroup, Test, User

### Community 81 - "TestGenerationJob"
Cohesion: 0.10
Nodes (4): TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 82 - "GlobalExceptionHandler.java"
Cohesion: 0.22
Nodes (11): cloneAssignment(), getActiveTeacherGroups(), getCloneAssignmentForm(), CloneAssignmentPage(), csv(), fieldClass(), LANGUAGES, localDateTimeMinimum() (+3 more)

### Community 83 - "TeacherGroupDetailPage.tsx"
Cohesion: 0.26
Nodes (20): teacherRequest(), archiveGroup(), createGroup(), deleteGroup(), getTeacherGroup(), groupPath(), listGroupStudents(), removeGroupStudent() (+12 more)

### Community 84 - "AdminUserController.java"
Cohesion: 0.29
Nodes (14): AdminUserController, ApiResponses, Authentication, DeleteMapping, GetMapping, Operation, PatchMapping, PostMapping (+6 more)

### Community 85 - "MetricsProjectionRepositoryTest"
Cohesion: 0.13
Nodes (10): Assignment, BeforeEach, ClassGroup, DataJpaTest, EntityManager, StudentAssignmentWork, Submission, Test (+2 more)

### Community 86 - "AbstractLanguageExecutor"
Cohesion: 0.19
Nodes (4): AbstractLanguageExecutor, DockerClient, Logger, HostConfig

### Community 87 - "TeacherDashboardPage.tsx"
Cohesion: 0.12
Nodes (15): listTeacherGroups(), getAssignmentMetrics(), getGroupMetricsOverview(), listAssignmentMetrics(), listStudentMetrics(), percentage(), TeacherAnalyticsPage(), TeacherDashboardPage() (+7 more)

### Community 88 - "Backend Controller Layer"
Cohesion: 0.12
Nodes (22): AdminUserController, AssignmentController, AuthController, CheckExecutionController, Backend Controller Layer, GlobalExceptionHandler, NotificationPreferenceController, RecoveryPasswordController (+14 more)

### Community 89 - "AuthController.java"
Cohesion: 0.24
Nodes (15): AuthController, ApiResponses, Authentication, GetMapping, MultipartFile, Operation, PostMapping, PreAuthorize (+7 more)

### Community 90 - "GroupMetricsController.java"
Cohesion: 0.31
Nodes (10): GroupMetricsController, ApiResponses, Authentication, GetMapping, Operation, ResponseEntity, RestController, SuccessResponse (+2 more)

### Community 91 - "ExecutionDTO"
Cohesion: 0.26
Nodes (4): Component, DockerClient, Override, JavaExecutor

### Community 92 - "CreateAssignmentPage.tsx"
Cohesion: 0.11
Nodes (8): CreateAssignmentPage(), EXT_TO_LANG, LANGUAGE_TEMPLATES, LANGUAGES, SolutionMode, TestCaseEntry, TestCaseMode, uid()

### Community 93 - "DisplayName"
Cohesion: 0.14
Nodes (17): ApplicationEvents, CheckExecutionControllerIntegrationTest, GetExecution, GetReport, ActiveProfiles, AutoConfigureMockMvc, DisplayName, Import (+9 more)

### Community 94 - "RateLimitAspect"
Cohesion: 0.19
Nodes (11): Around, Aspect, Bucket, Component, HttpServletRequest, Logger, RateLimitAspect, Service (+3 more)

### Community 95 - "ContainerSession"
Cohesion: 0.26
Nodes (5): Override, ContainerSession, ContainerSessionTest, DisplayName, Test

### Community 96 - "dependencies"
Cohesion: 0.11
Nodes (19): class-variance-authority, dependencies, class-variance-authority, isbot, monaco-editor, @radix-ui/react-select, react, react-resizable-panels (+11 more)

### Community 97 - "ExecutionTestCaseInfo"
Cohesion: 0.33
Nodes (4): Claims, Component, JwtUtil, SecretKey

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

### Community 103 - "SecurityConfig.java"
Cohesion: 0.29
Nodes (10): AuthenticationManager, AuthenticationProvider, Bean, Configuration, PasswordEncoder, SecurityConfig, EnableMethodSecurity, EnableWebSecurity (+2 more)

### Community 104 - "AdminUserControllerIntegrationTest"
Cohesion: 0.21
Nodes (10): AdminUserControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, MockMvc, PasswordEncoder, SpringBootTest, Test (+2 more)

### Community 106 - "TestCaseResult"
Cohesion: 0.41
Nodes (4): StudentAssignmentWorkDTO, Service, Transactional, StudentWorkQueryService

### Community 107 - "MockMultipartFile"
Cohesion: 0.46
Nodes (5): AsyncConfig, Bean, Configuration, EnableAsync, ThreadPoolTaskExecutor

### Community 108 - "CsvProgressWebSocketHandler"
Cohesion: 0.23
Nodes (10): CloseStatus, CsvProgressWebSocketHandler, Component, Logger, ObjectMapper, Override, PreDestroy, TextMessage (+2 more)

### Community 109 - "CheckExecutionController.java"
Cohesion: 0.32
Nodes (11): CheckExecutionController, ApiResponses, Authentication, GetMapping, Operation, PostMapping, RequestMapping, ResponseEntity (+3 more)

### Community 111 - "LandingPage.tsx"
Cohesion: 0.17
Nodes (8): Features, Footer(), footerLinks, socialLinks, Hero(), HowItWorks(), steps, LandingPage()

### Community 112 - "ExecutionResultProducer"
Cohesion: 0.22
Nodes (9): ExecutionRequestListener, Component, ExecutionReport, Logger, RabbitListener, ExecutionResultProducer, Logger, RabbitTemplate (+1 more)

### Community 113 - "Backend Model Implementation"
Cohesion: 0.15
Nodes (16): M6 verdictDistribution, Assignment entity, AssignmentUpdate entity, ClassGroup entity, CreateAssignmentRequest, Backend Model Implementation, Execution entity, ExecutionJob (queue DTO) (+8 more)

### Community 114 - "PythonExecutor"
Cohesion: 0.21
Nodes (5): BeforeAll, Component, DockerClient, Override, PythonExecutor

### Community 115 - "CsvRegistrationService"
Cohesion: 0.23
Nodes (7): CsvRegistrationService, Async, Logger, PasswordEncoder, Pattern, Service, ObjectProvider

### Community 116 - "AssignmentRepository"
Cohesion: 0.10
Nodes (12): Entity, Table, StudentAssignmentWork, AssignmentGradeHistoryRepository, AssignmentGradeRepository, Query, StudentAssignmentWorkRepository, Service (+4 more)

### Community 117 - "Métricas de desempeño para el docente"
Cohesion: 0.13
Nodes (15): Métricas de desempeño para el docente, M10 missingCount / missingStudents, M11 gradingProgress, M12 enrollment summary, M1 submissionRate, M2 averageScore per assignment, M3 averageScore per student, M5 averageDeliveryMarginHours (+7 more)

### Community 118 - "Teacher Frontend"
Cohesion: 0.19
Nodes (14): CloneAssignmentRequest, Query: expected frontend behavior when an assignment is cloned, Finding: clone requires group+dates only; graph lacked frontend clone node at the time, assignment.api.ts (teacher feature API module), /teacher/assignments/:assignmentId/clone route, Clone flow never inherits source scheduling dates, /teacher/create-assignment route, Teacher Frontend (+6 more)

### Community 119 - "ExecutionResultService.java"
Cohesion: 0.21
Nodes (10): ExecutionResultListener, Component, Logger, RabbitListener, ApplicationEventPublisher, Component, NotificationDomainEventPublisher, ExecutionResultService (+2 more)

### Community 121 - "AuthProvider.tsx"
Cohesion: 0.12
Nodes (16): getAuthToken(), MOCK_GROUPS, TODO: Replace with real backend endpoint once implemented, ApiResponse, authHeaders(), joinGroup(), listMyGroups(), parseResponse() (+8 more)

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
Cohesion: 0.32
Nodes (5): NotificationDomainEvent, Component, Transactional, TransactionalEventListener, NotificationDomainEventRouter

### Community 128 - "teacherRequest"
Cohesion: 0.22
Nodes (16): jsonRequest(), assignmentPath(), createFeedback(), deleteFeedback(), getStudentWork(), listFeedback(), listStudentWork(), returnGrade() (+8 more)

### Community 129 - "RabbitMQConfig"
Cohesion: 0.31
Nodes (5): Bean, Configuration, MessageConverter, RabbitMQConfig, SuppressWarnings

### Community 130 - "Backend Service Layer Implementation"
Cohesion: 0.24
Nodes (11): GroupController, AdminUserService, AuthService, CsvRegistrationService, Backend Service Layer Implementation, ExecutionRequestService (service doc), ExecutionResultService (service doc), GroupService (service doc) (+3 more)

### Community 131 - "NotificationEmailListener"
Cohesion: 0.18
Nodes (11): Role-specific notification catalog, Notification retry policy, NotificationDomainEvent, NotificationMessage, NotificationStrategyRegistry, Future notification requirements, Notification delivery workflow, Transactional email (+3 more)

### Community 134 - "ExecutionStatus"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Search controllers and create frontend teacher API services, types, and page integrations for teacher actions, Source Nodes

### Community 136 - "OpenApiCoverageIntegrationTest.java"
Cohesion: 0.36
Nodes (7): ActiveProfiles, AutoConfigureMockMvc, MockMvc, ObjectMapper, SpringBootTest, Test, OpenApiCoverageIntegrationTest

### Community 137 - "Late-submission reconciliation on due-date change"
Cohesion: 0.29
Nodes (10): Query: effect of teacher updating due date on late submissions, Finding: deliveredLate not recalculated on due-date update; no past-date validation existed, AssignmentUpdateService, Query: update due-date flow to reconcile late submissions and reject past dates, Finding: AssignmentUpdateService now reconciles late flags and rejects past dates, Late-submission reconciliation on due-date change, M4 onTimeRate / lateCount, Submission entity (+2 more)

### Community 138 - "TestExecutionService"
Cohesion: 0.20
Nodes (10): Backend queue topology, OutputComparatorService, Compilation gate, TestExecutionService, Worker ExecutionRequestListener, Worker messaging, Sandboxed execution worker, Container security hardening (+2 more)

### Community 139 - "WebSocketConfig"
Cohesion: 0.33
Nodes (6): Configuration, Override, WebSocketConfig, EnableWebSocket, WebSocketConfigurer, WebSocketHandlerRegistry

### Community 140 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, start, typecheck, type

### Community 141 - "ObjectStorageService"
Cohesion: 0.33
Nodes (4): Logger, MinioClient, Service, ObjectStorageService

### Community 142 - "Grupos, tareas y entregas"
Cohesion: 0.31
Nodes (9): Assignment (groups doc), AssignmentFeedback (groups doc), AssignmentGrade (groups doc), ClassGroup, Grupos, tareas y entregas, GroupEnrollment, Deleted-group join code indistinguishable from nonexistent code, StudentAssignmentWork (+1 more)

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

### Community 152 - "EmailTemplateConfig.java"
Cohesion: 0.53
Nodes (4): EmailTemplateConfig, Bean, Configuration, TemplateEngine

### Community 153 - "codehive/config/MinioConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, MinioClient, MinioConfig

### Community 154 - "OpenAPIConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, OpenAPIConfig, OpenAPI

### Community 155 - "metrics.types.ts"
Cohesion: 0.22
Nodes (12): AssignmentUpdateKind, AssignmentUpdateStatus, AssignmentValidationStatus, Language, SampleTestCase, TestSuiteUpdateMode, AssignmentMetrics, AssignmentMetricsDetail (+4 more)

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

### Community 164 - "DisplayName"
Cohesion: 0.35
Nodes (4): SandboxConstants, DisplayName, Test, SandboxConstantsTest

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

### Community 180 - "codehive-worker/gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 183 - "Welcome email template"
Cohesion: 1.00
Nodes (3): Welcome email template, Plain-text welcome template, Backend authentication model

### Community 255 - "ExecutionJob"
Cohesion: 0.03
Nodes (13): CloneAssignmentFormDTO, ExecutionJob, ExecutionTestCaseInfo, ComparatorType, EXACT_MATCH, FLOATING_POINT, Language, C (+5 more)

## Knowledge Gaps
- **425 isolated node(s):** `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE`, `VALIDATING`, `APPLIED` (+420 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **78 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `.students()` (2× useful, score=1.418884937)
- `.listStudents()` (2× useful, score=1.418884937)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User Entity` to `Sign-Up Request DTO`, `Assignment Feedback & Student Work`, `Execution Job Queue Model`, `User Notification Settings`, `User DTO`, `CSV Bulk Register Response`, `Email Template Rendering`, `Async Config & Ownership Permission Tests`, `Notification Preferences`, `Admin User Controller`, `Group Metrics Overview`, `Assignment Controller Integration Tests`, `Assignment Service & Clone DTOs`, `Notification Email Listener`, `Assignment Update Entity`, `Notification Dispatch Log`, `Assignment Entity`, `Execution Entity`, `Create Assignment Request`, `Group Service`, `Submission DTO`, `Notification Format Service`, `Group Controller Integration Tests`, `Execution Request Service`, `Auth Response`, `AssignmentGrade`, `PasswordResetToken`, `ClassGroup`, `AssignmentFeedback`, `AssignmentGradeHistory`, `Scope`, `RecoveryPasswordRequest`, `GroupMetricsControllerIntegrationTest.java`, `NotificationPreferenceController.java`, `.create`, `DisplayName`, `GroupServiceTest`, `MetricsProjectionRepositoryTest`, `DisplayName`, `AdminUserControllerIntegrationTest`, `TestCaseResult`, `AssignmentRepository`, `NotificationDomainEventRouter`, `RecoveryPasswordControllerIntegrationTest.java`, `ExecutionJob`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `LoginPage()` connect `useTheme` to `Auth Response`, `useAuth`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `CSV Bulk Register Response` to `Sign-Up Request DTO`, `Assignment Feedback & Student Work`, `Async Config & Ownership Permission Tests`, `Notification Preferences`, `Admin User Controller`, `Group Metrics Overview`, `Assignment Controller Integration Tests`, `Assignment Service & Clone DTOs`, `Notification Email Listener`, `Assignment Update Entity`, `Notification Dispatch Log`, `Group Service`, `Notification Format Service`, `User Entity`, `Group Controller Integration Tests`, `Execution Request Service`, `Submission Entity`, `Auth Response`, `Scope.java`, `PasswordResetToken`, `JwtUtil`, `AssignmentFeedback`, `GroupMetricsControllerIntegrationTest.java`, `DisplayName`, `GroupServiceTest`, `MetricsProjectionRepositoryTest`, `DisplayName`, `AdminUserControllerIntegrationTest`, `TestCaseResult`, `CsvRegistrationService`, `AssignmentRepository`, `RecoveryPasswordControllerIntegrationTest.java`, `NotificationDomainEventRouter`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE` to the rest of the system?**
  _425 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Assignment Update Requests` be split into smaller, more focused modules?**
  _Cohesion score 0.0726775956284153 - nodes in this community are weakly interconnected._
- **Should `Sign-Up Request DTO` be split into smaller, more focused modules?**
  _Cohesion score 0.0687719298245614 - nodes in this community are weakly interconnected._
- **Should `Domain Exceptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06672519754170325 - nodes in this community are weakly interconnected._