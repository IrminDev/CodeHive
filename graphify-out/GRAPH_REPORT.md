# Graph Report - .  (2026-08-04)

## Corpus Check
- 74 files · ~158,400 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4481 nodes · 10067 edges · 292 communities (189 shown, 103 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 1011 edges (avg confidence: 0.8)
- Token cost: 139,311 input · 0 output

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
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 224
- Community 228
- Community 237
- Community 238
- Community 239
- Community 240
- Community 241
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 250
- Community 251
- Community 252
- Community 253
- Community 254
- Community 255
- Community 256
- Community 267
- Community 268
- Community 269
- Community 270
- Community 271
- Community 272
- Community 273
- Community 274
- Community 275
- Community 276
- Community 277
- Community 278
- Community 279
- Community 280
- Community 281
- Community 282
- Community 283
- Community 284
- Community 285
- Community 286
- Community 287
- Community 288
- Community 289
- Community 290
- Community 291

## God Nodes (most connected - your core abstractions)
1. `User` - 152 edges
2. `Assignment` - 97 edges
3. `NotificationType` - 67 edges
4. `AssignmentDTO` - 60 edges
5. `UpdateAssignmentRequest` - 60 edges
6. `AssignmentRepository` - 59 edges
7. `UserDTO` - 57 edges
8. `UserRepository` - 57 edges
9. `AssignmentUpdateService` - 54 edges
10. `Execution` - 48 edges

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

## Communities (292 total, 103 thin omitted)

### Community 0 - "Assignment Update Requests"
Cohesion: 0.05
Nodes (31): AssignmentUpdate, AssignmentUpdateRepository, AssignmentExampleRequest, TestSuiteUpdateMode, UpdateAssignmentRequest, AssignmentUpdateService, ApplicationEventPublisher, Assignment (+23 more)

### Community 1 - "JWT Authentication Filter"
Cohesion: 0.05
Nodes (37): Claims, Component, HttpServletRequest, Logger, Override, JWTAuthenticationFilter, Override, Service (+29 more)

### Community 2 - "Sign-Up Request DTO"
Cohesion: 0.07
Nodes (22): SignUpRequest, UpdatePasswordRequest, AuthControllerIntegrationTest, ContentTypeTests, CsvSignUpEndpointTests, ActiveProfiles, AutoConfigureMockMvc, BeforeEach (+14 more)

### Community 3 - "Domain Exceptions"
Cohesion: 0.06
Nodes (24): AccessDeniedException, ArtifactExpiredException, AlreadyRegisteredEmailException, AlreadyRegisteredEnrollmentNumberException, ExpiredJWTException, IncorrectCredentialsException, InvalidJWTException, EntityNotFoundException (+16 more)

### Community 4 - "Assignment Feedback & Student Work"
Cohesion: 0.08
Nodes (41): AssignmentFeedback, AssignmentFeedbackRepository, AssignmentGradeHistoryRepository, AssignmentStudentWorkController, AssignmentFeedbackDTO, AssignmentGradeDTO, Authentication, DeleteMapping (+33 more)

### Community 5 - "Execution Job Queue Model"
Cohesion: 0.04
Nodes (15): ExecutionJob, ComparatorType, EXACT_MATCH, FLOATING_POINT, ExecutionType, DEFINITIVE, PRACTICE, Language (+7 more)

### Community 6 - "Frontend Assignment API Client"
Cohesion: 0.06
Nodes (41): ApiResponse, AssignmentExample, AssignmentPage, authHeaders(), cloneAssignment(), CloneAssignmentForm, CloneAssignmentPayload, ComparatorType (+33 more)

### Community 7 - "User Notification Settings"
Cohesion: 0.07
Nodes (14): Entity, Table, UserNotificationSettings, UpdateNotificationPreferenceRequest, UpdateNotificationSettingsRequest, UserNotificationPreferenceRepository, UserNotificationSettingsRepository, Service (+6 more)

### Community 8 - "User DTO"
Cohesion: 0.12
Nodes (13): UserDTO, User, UserMapper, DTOToEntityTests, EntityToDTOTests, BeforeEach, DisplayName, Nested (+5 more)

### Community 9 - "CSV Bulk Register Response"
Cohesion: 0.12
Nodes (16): CsvBulkRegisterResponse, JsonInclude, AuthServiceTest, CsvBulkRegistrationTests, BeforeEach, DisplayName, ExtendWith, LoginRequest (+8 more)

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
Nodes (24): EmailTemplateRenderer, Component, TemplateEngine, RenderedEmail, Async, JavaMailSender, Logger, Service (+16 more)

### Community 14 - "C Language Executor"
Cohesion: 0.07
Nodes (16): CExecutor, Component, DockerClient, Override, CPPExecutor, Component, DockerClient, Override (+8 more)

### Community 15 - "Async Config & Ownership Permission Tests"
Cohesion: 0.10
Nodes (29): AsyncConfigurer, Override, TestConfiguration, TestAsyncConfig, AssignmentsHonorOwnership, GroupsHonorOwnership, ActiveProfiles, Assignment (+21 more)

### Community 16 - "Notification Preferences"
Cohesion: 0.05
Nodes (29): NotificationPreferenceDTO, Entity, Table, UserNotificationPreference, forRole(), getAudience(), NotificationType, ASSIGNMENT_CLOSE_SOON (+21 more)

### Community 17 - "Admin User Controller"
Cohesion: 0.11
Nodes (19): AdminUserController, ApiResponses, Authentication, DeleteMapping, GetMapping, Operation, PatchMapping, PostMapping (+11 more)

### Community 18 - "Group Metrics Overview"
Cohesion: 0.11
Nodes (21): CurrentSubmissionRow, StudentWorkStatus, AssignmentBreakdown, EnrollmentBreakdown, GradingProgress, GroupMetricsOverviewDTO, GradeStatus, StudentGradeRow (+13 more)

### Community 19 - "Clone Assignment Request"
Cohesion: 0.08
Nodes (3): CloneAssignmentRequest, AssignmentExampleRequest, CloneTestCaseRequest

### Community 20 - "Language Executor Factory"
Cohesion: 0.10
Nodes (17): Component, Logger, LanguageExecutorFactory, LanguageExecutor, ExecutionReport, Logger, ObjectMapper, Service (+9 more)

### Community 21 - "Assignment Controller Integration Tests"
Cohesion: 0.11
Nodes (27): AssignmentControllerIntegrationTest, CreateAssignment, GetAssignmentById, ActiveProfiles, Assignment, AutoConfigureMockMvc, BeforeEach, ClassGroup (+19 more)

### Community 22 - "Assignment Service & Clone DTOs"
Cohesion: 0.12
Nodes (22): AssignmentExampleDTO, CloneAssignmentFormDTO, CloneAssignmentTestCaseDTO, AssignmentService, Assignment, AssignmentDTO, AssignmentExampleRequest, ClassGroup (+14 more)

### Community 23 - "Output Comparator Service"
Cohesion: 0.15
Nodes (11): ComparisonResult, Logger, Service, OutputComparatorService, ExactMatch, FloatingPoint, BeforeEach, DisplayName (+3 more)

### Community 24 - "Notification Email Listener"
Cohesion: 0.12
Nodes (17): Component, Logger, RabbitListener, Transactional, NotificationEmailListener, Component, Logger, RabbitTemplate (+9 more)

### Community 25 - "Assignment Update Entity"
Cohesion: 0.07
Nodes (13): AssignmentUpdateDTO, AssignmentUpdate, Entity, Table, AssignmentUpdateKind, METADATA, REFERENCE_ONLY, TEST_SUITE (+5 more)

### Community 26 - "Notification Dispatch Log"
Cohesion: 0.10
Nodes (13): Entity, Table, NotificationDispatchLog, Service, Transactional, NotificationDispatchService, Component, Logger (+5 more)

### Community 27 - "Execution Result Model"
Cohesion: 0.11
Nodes (11): ExecutionResult, CE, ExecutionResultTest, DisplayName, Nested, Test, MLE, OLE (+3 more)

### Community 28 - "Test Case Info (Queue)"
Cohesion: 0.06
Nodes (5): TestCaseInfo, TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 29 - "Assignment Entity"
Cohesion: 0.06
Nodes (3): Assignment, Entity, Table

### Community 30 - "Execution Entity"
Cohesion: 0.10
Nodes (10): Execution, Entity, Table, ExecutionTrigger, ASSIGNMENT_UPDATE, INITIAL_SUBMISSION, MANUAL_RETRY, PRACTICE (+2 more)

### Community 32 - "Frontend Protected Route & Admin Pages"
Cohesion: 0.10
Nodes (10): ProtectedRoute(), ProtectedRouteProps, AuthContextType, CreateUserPage(), ROLE_OPTIONS, CsvUploadPage(), TeacherDashboardPage(), getDashboardRoute() (+2 more)

### Community 33 - "Group Service"
Cohesion: 0.16
Nodes (12): GroupService, ClassGroup, ClassGroupRepository, CreateGroupRequest, GroupDTO, NotificationDomainEventPublisher, Service, Transactional (+4 more)

### Community 34 - "Submission DTO"
Cohesion: 0.09
Nodes (7): JsonInclude, SubmissionDTO, SubmissionStatus, SUBMITTED, SUPERSEDED, WITHDRAWN, SubmissionMapper

### Community 35 - "Test Generation Listener"
Cohesion: 0.08
Nodes (13): Component, Logger, RabbitListener, TestGenerationRequestListener, Logger, RabbitTemplate, Service, TestGenerationResultProducer (+5 more)

### Community 36 - "Notification Format Service"
Cohesion: 0.11
Nodes (12): NotificationEmailContent, Component, NotificationFormatService, NotificationStrategy, AssignmentNotificationStrategy, Component, Override, GroupNotificationStrategy (+4 more)

### Community 37 - "Frontend Execution API Client"
Cohesion: 0.09
Nodes (21): ApiResponse, authHeaders(), getExecution(), getExecutionReport(), parseResponse(), submitExecution(), ActiveTab, AssignmentPage() (+13 more)

### Community 38 - "Group Controller"
Cohesion: 0.24
Nodes (19): GroupController, ApiResponses, Authentication, CreateGroupRequest, DeleteMapping, GetMapping, GroupDTO, Operation (+11 more)

### Community 39 - "Reevaluation Batch"
Cohesion: 0.09
Nodes (8): Entity, Table, ReevaluationBatch, ReevaluationBatchStatus, COMPLETED, COMPLETED_WITH_FAILURES, DISPATCHING, PROCESSING

### Community 40 - "User Entity"
Cohesion: 0.08
Nodes (7): Entity, Override, Table, User, GrantedAuthority, PrePersist, UserDetails

### Community 41 - "Group Controller Integration Tests"
Cohesion: 0.11
Nodes (15): GroupControllerIntegrationTest, ActiveProfiles, AutoConfigureMockMvc, BeforeEach, ClassGroupRepository, DisplayName, JwtUtil, MockMvc (+7 more)

### Community 42 - "Execution Request Service"
Cohesion: 0.13
Nodes (20): ExecutionRequestService, ApplicationEventPublisher, Assignment, Execution, ExecutionRequestProducer, NotificationDomainEventPublisher, ObjectMapper, ObjectStorageService (+12 more)

### Community 43 - "Submission Entity"
Cohesion: 0.11
Nodes (7): Entity, Table, Submission, Transactional, Fixture, Test, SubmissionLifecycleServiceTest

### Community 44 - "Auth Response"
Cohesion: 0.11
Nodes (11): AuthResponse, AuthService, AuthResponse, MultipartFile, PasswordEncoder, Pattern, Service, Transactional (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.11
Nodes (22): ApiResponse, authHeaders(), getAssignment(), listAssignments(), parseResponse(), getGroups(), MOCK_GROUPS, GroupCard() (+14 more)

### Community 46 - "Community 46"
Cohesion: 0.10
Nodes (16): AdminInitializer, Component, Logger, Override, PasswordEncoder, Scope, UserRepository, Test (+8 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (9): Entity, Table, ReferenceSolutionRevision, RevisionStatus, ACTIVE, FAILED, PROCESSING, SUPERSEDED (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (13): getInitialTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), RecoveryPasswordPage(), ResetPasswordPage() (+5 more)

### Community 49 - "Community 49"
Cohesion: 0.08
Nodes (7): AssignmentGradeDTO, AssignmentGrade, Entity, Table, GradeStatus, DRAFT, RETURNED

### Community 50 - "Community 50"
Cohesion: 0.13
Nodes (14): Entity, Table, PasswordResetToken, PasswordResetTokenRepository, PasswordEncoder, Service, Transactional, RecoveryPasswordService (+6 more)

### Community 51 - "Community 51"
Cohesion: 0.10
Nodes (4): Entity, Table, TestSuiteRevision, TestSuiteRevisionRepository

### Community 53 - "Community 53"
Cohesion: 0.13
Nodes (11): Role, ADMIN, STUDENT, TEACHER, EnrollmentNumberRules, Pattern, EnrollmentNumberRulesTest, Test (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.16
Nodes (13): Query, StudentAssignmentWork, StudentAssignmentWorkRepository, Assignment, AssignmentGrade, AssignmentGradeDTO, Service, StudentAssignmentWork (+5 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (10): Binding, Bean, Configuration, MessageConverter, RabbitConfig, Logger, RabbitTemplate, Service (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.24
Nodes (18): AssignmentController, ApiResponses, AssignmentDTO, AssignmentUpdateDTO, Authentication, DeleteMapping, GetMapping, Logger (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.10
Nodes (8): AssignmentFeedbackDTO, AssignmentFeedback, Entity, Table, FeedbackStatus, DELETED, PUBLISHED, AssignmentFeedbackRepository

### Community 58 - "Community 58"
Cohesion: 0.11
Nodes (12): StudentAssignmentWorkDTO, Entity, Table, StudentAssignmentWork, StudentWorkStatus, NOT_SUBMITTED, RETURNED, SUBMITTED (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.09
Nodes (11): AssignmentGradeHistory, Entity, Table, GradeChangeReason, CLEARED_MAX_POINTS_CHANGED, CLEARED_RESUBMISSION, CLEARED_TEST_SUITE_CHANGED, CREATED (+3 more)

### Community 60 - "Community 60"
Cohesion: 0.16
Nodes (20): CsvProgressMessage, CsvTaskResponse, forgotPassword(), getMe(), login(), resetPassword(), signUp(), updatePassword() (+12 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (16): ApiResponse, ApiResponses, Operation, PostMapping, RequestMapping, ResponseEntity, RestController, SecurityRequirements (+8 more)

### Community 62 - "Community 62"
Cohesion: 0.09
Nodes (15): JsonInclude, Scope, CHECK_ANALYTICS, CREATE_ADMINS, CREATE_GROUP, CREATE_USERS, MANAGE_ADMIN_STATUS, MANAGE_GROUPS (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.34
Nodes (3): RecoveryPasswordRequest, Test, ResetPasswordEndpointTests

### Community 64 - "Community 64"
Cohesion: 0.09
Nodes (6): CsvProgressMessage, Status, COMPLETED, PROCESSING, ROW_ERROR, ROW_SUCCESS

### Community 65 - "Community 65"
Cohesion: 0.16
Nodes (16): GroupMetricsControllerIntegrationTest, ActiveProfiles, Assignment, AutoConfigureMockMvc, BeforeEach, ClassGroup, ClassGroupRepository, DisplayName (+8 more)

### Community 66 - "Community 66"
Cohesion: 0.10
Nodes (19): Badge(), BadgeProps, badgeVariants, Button, ButtonProps, buttonVariants, SelectContent, SelectItem (+11 more)

### Community 67 - "Community 67"
Cohesion: 0.08
Nodes (25): compilerOptions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit, paths (+17 more)

### Community 68 - "Community 68"
Cohesion: 0.24
Nodes (7): AddTestCase, DetermineOverallStatus, ExecutionReportTest, DisplayName, Nested, Test, TestCaseResult

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (15): ApiResponse, Authentication, GetMapping, Operation, PostMapping, PutMapping, RequestMapping, ResponseEntity (+7 more)

### Community 70 - "Community 70"
Cohesion: 0.13
Nodes (5): ExecutionJob, ExecutionTestCaseInfo, ObjectKeyBuilder, Test, ObjectKeyBuilderTest

### Community 71 - "Community 71"
Cohesion: 0.09
Nodes (4): ExecutionJob, ExecutionType, DEFINITIVE, PRACTICE

### Community 72 - "Community 72"
Cohesion: 0.28
Nodes (7): AfterAll, DisplayName, DockerClient, Tag, Test, SandboxSecurityTest, TestMethodOrder

### Community 73 - "Community 73"
Cohesion: 0.14
Nodes (12): ExecutionRequestProducer, Logger, RabbitTemplate, Service, ReevaluationBatchRepository, ReevaluationJobsCreatedEvent, ReevaluationRequestedEvent, ApplicationEventPublisher (+4 more)

### Community 75 - "Community 75"
Cohesion: 0.14
Nodes (7): EnrollmentDTO, EnrollmentStatus, EnrollmentStudentDTO, GroupMapper, ClassGroup, GroupDTO, GroupEnrollment

### Community 76 - "Community 76"
Cohesion: 0.16
Nodes (15): AuthContext, AuthProvider(), useAuth(), getAuthToken(), removeAuthToken(), setAuthToken(), AdminDashboardPage(), NAV_CARDS (+7 more)

### Community 77 - "Community 77"
Cohesion: 0.17
Nodes (21): ApplicationEvents, CheckExecutionControllerIntegrationTest, ActiveProfiles, Assignment, AutoConfigureMockMvc, BeforeEach, ClassGroupRepository, ExecutionRequestProducer (+13 more)

### Community 79 - "Community 79"
Cohesion: 0.22
Nodes (5): DisplayName, Nested, Test, ResetPasswordTests, SendPasswordResetEmailTests

### Community 80 - "Community 80"
Cohesion: 0.15
Nodes (9): CreateGroupRequest, GroupServiceTest, BeforeEach, ClassGroup, ClassGroupRepository, NotificationDomainEventPublisher, Test, User (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.10
Nodes (4): TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION

### Community 83 - "Community 83"
Cohesion: 0.17
Nodes (7): SubmissionAttemptCount, Assignment, Query, Submission, User, SubmissionRepository, Modifying

### Community 84 - "Community 84"
Cohesion: 0.11
Nodes (7): GroupEnrollment, Entity, Table, EnrollmentStatus, ACTIVE, LEFT, REMOVED

### Community 85 - "Community 85"
Cohesion: 0.21
Nodes (15): Assignment, BeforeEach, ClassGroup, ClassGroupRepository, EntityManager, Execution, ExecutionStatus, StudentAssignmentWork (+7 more)

### Community 86 - "Community 86"
Cohesion: 0.19
Nodes (4): AbstractLanguageExecutor, DockerClient, Logger, HostConfig

### Community 87 - "Community 87"
Cohesion: 0.16
Nodes (21): 1. Group creation, 2. Join group, 3. Create assignment, 4. Create submission and evaluate it, 5. Grading, 6. Give feedback, Asynchronous evaluation phase, Asynchronous worker phase (+13 more)

### Community 88 - "Community 88"
Cohesion: 0.12
Nodes (22): AdminUserController, AssignmentController, AuthController, CheckExecutionController, Backend Controller Layer, GlobalExceptionHandler, NotificationPreferenceController, RecoveryPasswordController (+14 more)

### Community 89 - "Community 89"
Cohesion: 0.26
Nodes (15): AuthController, ApiResponses, Authentication, GetMapping, MultipartFile, Operation, PostMapping, PreAuthorize (+7 more)

### Community 90 - "Community 90"
Cohesion: 0.24
Nodes (13): GroupMetricsController, ApiResponses, Authentication, GetMapping, Operation, ResponseEntity, RestController, SuccessResponse (+5 more)

### Community 92 - "Community 92"
Cohesion: 0.10
Nodes (3): AssignmentExample, Entity, Table

### Community 93 - "Community 93"
Cohesion: 0.27
Nodes (7): GetExecution, GetReport, DisplayName, Nested, Test, SubmitExecution, ExecutionRequest

### Community 94 - "Community 94"
Cohesion: 0.19
Nodes (11): Around, Aspect, Bucket, Component, HttpServletRequest, Logger, RateLimitAspect, Service (+3 more)

### Community 95 - "Community 95"
Cohesion: 0.26
Nodes (5): Override, ContainerSession, ContainerSessionTest, DisplayName, Test

### Community 96 - "Community 96"
Cohesion: 0.11
Nodes (19): class-variance-authority, dependencies, class-variance-authority, isbot, monaco-editor, @radix-ui/react-select, react, react-resizable-panels (+11 more)

### Community 98 - "Community 98"
Cohesion: 0.21
Nodes (6): ForgotPasswordRequest, ContentTypeTests, ForgotPasswordEndpointTests, DisplayName, Nested, SecurityTests

### Community 99 - "Community 99"
Cohesion: 0.11
Nodes (19): devDependencies, @react-router/dev, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+11 more)

### Community 101 - "Community 101"
Cohesion: 0.11
Nodes (19): AssignmentController (sequence spec), AssignmentFeedbackService (sequence spec), AssignmentGradeService (sequence spec), AssignmentService (sequence spec), AssignmentStudentWorkController (sequence spec), CheckExecutionController (sequence spec), Flow 3: Create assignment, Flow 4: Create submission and evaluate it (+11 more)

### Community 102 - "Community 102"
Cohesion: 0.11
Nodes (18): cavecrew, cavecrew delegation matrix, cavecrew-builder, cavecrew-investigator, cavecrew-reviewer, caveman-commit, Conventional Commits, caveman-compress (+10 more)

### Community 103 - "Community 103"
Cohesion: 0.24
Nodes (12): AuthenticationManager, AuthenticationProvider, Bean, PasswordEncoder, SecurityConfig, Configuration, EnableMethodSecurity, EnableWebSecurity (+4 more)

### Community 104 - "Community 104"
Cohesion: 0.18
Nodes (6): Assignment, TestSuiteRevision, TestCase, TestCaseRepository, Entity, Table

### Community 106 - "Community 106"
Cohesion: 0.29
Nodes (6): AssignmentRepository, Assignment, AssignmentValidationStatus, Page, Query, Pageable

### Community 107 - "Community 107"
Cohesion: 0.23
Nodes (5): ExecutionRepository, Execution, ExecutionStatus, Query, ExecutionType

### Community 108 - "Community 108"
Cohesion: 0.23
Nodes (10): CloseStatus, CsvProgressWebSocketHandler, Component, Logger, ObjectMapper, Override, PreDestroy, TextMessage (+2 more)

### Community 109 - "Community 109"
Cohesion: 0.29
Nodes (11): CheckExecutionController, ApiResponses, Authentication, GetMapping, Operation, PostMapping, RequestMapping, ResponseEntity (+3 more)

### Community 110 - "Community 110"
Cohesion: 0.21
Nodes (12): ApiResponse, Authentication, Operation, PostMapping, RequestMapping, ResponseEntity, RestController, SuccessResponse (+4 more)

### Community 111 - "Community 111"
Cohesion: 0.17
Nodes (8): Features, Footer(), footerLinks, socialLinks, Hero(), HowItWorks(), steps, LandingPage()

### Community 112 - "Community 112"
Cohesion: 0.22
Nodes (9): ExecutionRequestListener, Component, ExecutionReport, Logger, RabbitListener, ExecutionResultProducer, Logger, RabbitTemplate (+1 more)

### Community 113 - "Community 113"
Cohesion: 0.15
Nodes (16): M6 verdictDistribution, Assignment entity, AssignmentUpdate entity, ClassGroup entity, CreateAssignmentRequest, Backend Model Implementation, Execution entity, ExecutionJob (queue DTO) (+8 more)

### Community 114 - "Community 114"
Cohesion: 0.21
Nodes (5): BeforeAll, Component, DockerClient, Override, PythonExecutor

### Community 115 - "Community 115"
Cohesion: 0.23
Nodes (8): CsvRegistrationService, Async, Logger, PasswordEncoder, Pattern, Service, CSVRecord, ObjectProvider

### Community 116 - "Community 116"
Cohesion: 0.20
Nodes (8): Component, Logger, RabbitListener, Transactional, TestGenerationResultListener, ApplicationEventPublisher, Component, NotificationDomainEventPublisher

### Community 117 - "Community 117"
Cohesion: 0.13
Nodes (15): Métricas de desempeño para el docente, M10 missingCount / missingStudents, M11 gradingProgress, M12 enrollment summary, M1 submissionRate, M2 averageScore per assignment, M3 averageScore per student, M5 averageDeliveryMarginHours (+7 more)

### Community 118 - "Community 118"
Cohesion: 0.19
Nodes (14): CloneAssignmentRequest, Query: expected frontend behavior when an assignment is cloned, Finding: clone requires group+dates only; graph lacked frontend clone node at the time, assignment.api.ts (teacher feature API module), /teacher/assignments/:assignmentId/clone route, Clone flow never inherits source scheduling dates, /teacher/create-assignment route, Teacher Frontend (+6 more)

### Community 119 - "Community 119"
Cohesion: 0.24
Nodes (8): ExecutionResultListener, Component, Logger, RabbitListener, ExecutionResultService, Logger, Service, Transactional

### Community 121 - "Community 121"
Cohesion: 0.27
Nodes (6): EnrollmentStatusCount, EnrollmentStatus, GroupEnrollmentRepository, EnrollmentStatus, GroupEnrollment, Query

### Community 123 - "Community 123"
Cohesion: 0.17
Nodes (12): Query: Is group student list visible only to teacher?, Finding: only group-owning teacher could originally list students, Query: extend roster visibility to enrolled students, Finding: requireStudentListAccess() authorizes owner or active enrollment, list-only, AssignmentController (groups doc), AssignmentStudentWorkController (groups doc), GroupController (groups doc), GroupMetricsController (+4 more)

### Community 124 - "Community 124"
Cohesion: 0.18
Nodes (12): codehive-backend (Spring Boot REST API, Java 21), codehive-frontend (React Router v7 SPA, TypeScript), codehive_queue (backend to worker execution jobs), codehive_result_queue (worker to backend execution results), codehive_test_generation_queue (backend to worker), codehive-worker (Spring Boot sandbox executor, Java 21), utils/ObjectKeyBuilder, AGENTS.md - CodeHive Root Instructions (+4 more)

### Community 125 - "Community 125"
Cohesion: 0.29
Nodes (10): ActiveProfiles, AutoConfigureMockMvc, BeforeEach, MockMvc, ObjectMapper, PasswordEncoder, SpringBootTest, Transactional (+2 more)

### Community 126 - "Community 126"
Cohesion: 0.17
Nodes (5): Language, C, CPP, JAVA, PYTHON

### Community 128 - "Community 128"
Cohesion: 0.31
Nodes (5): AssignmentExampleRepository, AssignmentGradeRepository, AssignmentGrade, Query, JpaRepository

### Community 129 - "Community 129"
Cohesion: 0.31
Nodes (5): Bean, Configuration, MessageConverter, RabbitMQConfig, SuppressWarnings

### Community 130 - "Community 130"
Cohesion: 0.24
Nodes (11): GroupController, AdminUserService, AuthService, CsvRegistrationService, Backend Service Layer Implementation, ExecutionRequestService (service doc), ExecutionResultService (service doc), GroupService (service doc) (+3 more)

### Community 131 - "Community 131"
Cohesion: 0.18
Nodes (11): Role-specific notification catalog, Notification retry policy, NotificationDomainEvent, NotificationMessage, NotificationStrategyRegistry, Future notification requirements, Notification delivery workflow, Transactional email (+3 more)

### Community 132 - "Community 132"
Cohesion: 0.20
Nodes (5): JsonInclude, AssignmentValidationStatus, FAILED, PROCESSING, READY

### Community 134 - "Community 134"
Cohesion: 0.33
Nodes (9): AcceptedPerformance, AssignmentMetricsDetailDTO, GradeSummary, AssignmentValidationStatus, ExecutionStatus, GradeStatus, StudentWorkStatus, StudentBreakdown (+1 more)

### Community 136 - "Community 136"
Cohesion: 0.36
Nodes (7): ActiveProfiles, AutoConfigureMockMvc, MockMvc, ObjectMapper, SpringBootTest, Test, OpenApiCoverageIntegrationTest

### Community 137 - "Community 137"
Cohesion: 0.29
Nodes (10): Query: effect of teacher updating due date on late submissions, Finding: deliveredLate not recalculated on due-date update; no past-date validation existed, AssignmentUpdateService, Query: update due-date flow to reconcile late submissions and reject past dates, Finding: AssignmentUpdateService now reconciles late flags and rejects past dates, Late-submission reconciliation on due-date change, M4 onTimeRate / lateCount, Submission entity (+2 more)

### Community 138 - "Community 138"
Cohesion: 0.20
Nodes (10): Backend queue topology, OutputComparatorService, Compilation gate, TestExecutionService, Worker ExecutionRequestListener, Worker messaging, Sandboxed execution worker, Container security hardening (+2 more)

### Community 139 - "Community 139"
Cohesion: 0.33
Nodes (6): Configuration, Override, WebSocketConfig, EnableWebSocket, WebSocketConfigurer, WebSocketHandlerRegistry

### Community 140 - "Community 140"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, start, typecheck, type

### Community 141 - "Community 141"
Cohesion: 0.33
Nodes (4): Logger, MinioClient, Service, ObjectStorageService

### Community 142 - "Community 142"
Cohesion: 0.31
Nodes (9): Assignment (groups doc), AssignmentFeedback (groups doc), AssignmentGrade (groups doc), ClassGroup, Grupos, tareas y entregas, GroupEnrollment, Deleted-group join code indistinguishable from nonexistent code, StudentAssignmentWork (+1 more)

### Community 143 - "Community 143"
Cohesion: 0.46
Nodes (5): AsyncConfig, Bean, Configuration, EnableAsync, ThreadPoolTaskExecutor

### Community 146 - "Community 146"
Cohesion: 0.25
Nodes (3): ComparatorType, EXACT_MATCH, FLOATING_POINT

### Community 147 - "Community 147"
Cohesion: 0.32
Nodes (8): Assignment creation examples, Assignment updates and evaluation workflow, Staged assignment update, Core API workflow, Definitive submission, Practice execution, Negative and boundary scenarios, Manual API testing guide

### Community 148 - "Community 148"
Cohesion: 0.52
Nodes (6): generate_email(), generate_enrollment_number(), generate_users(), main(), random_last_name(), random_name()

### Community 149 - "Community 149"
Cohesion: 0.29
Nodes (5): Entity, Table, Component, Transactional, TransactionalEventListener

### Community 151 - "Community 151"
Cohesion: 0.43
Nodes (3): MinioClient, Service, ObjectStorageService

### Community 152 - "Community 152"
Cohesion: 0.53
Nodes (4): EmailTemplateConfig, Bean, Configuration, TemplateEngine

### Community 153 - "Community 153"
Cohesion: 0.53
Nodes (4): Bean, Configuration, MinioClient, MinioConfig

### Community 154 - "Community 154"
Cohesion: 0.53
Nodes (4): Bean, Configuration, OpenAPIConfig, OpenAPI

### Community 157 - "Community 157"
Cohesion: 0.40
Nodes (6): CodeHive brand logo, Hexagonal badge motif, High-contrast navy and gold palette, Hive-inspired badge rationale, CodeHive primary logo mark, Programming identity

### Community 158 - "Community 158"
Cohesion: 0.33
Nodes (6): Sliding-window test fixture guide, Sliding-window sample input, Sliding-window hidden input two, All-negative sliding-window input, Single-element sliding-window input, Mixed-value sliding-window input

### Community 159 - "Community 159"
Cohesion: 0.53
Nodes (4): DockerClientConfig, Bean, Configuration, DockerClient

### Community 160 - "Community 160"
Cohesion: 0.53
Nodes (4): Bean, Configuration, MinioClient, MinioConfig

### Community 161 - "Community 161"
Cohesion: 0.53
Nodes (4): Import, SpringBootTest, Test, WorkerApplicationTests

### Community 162 - "Community 162"
Cohesion: 0.40
Nodes (5): Dependabot updates, Backend CI, CI/CD Pipeline, Worker CI, pull request template

### Community 164 - "Community 164"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Does the list of students in a same group is only visible for the teacher or other students can see it?, Source Nodes

### Community 165 - "Community 165"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Modify this rule in order that other students within the same group can see the list of the other users in the group, they will be able to see only the list, they aren't supposed to see other things like their assignments, grades, etc, only the list of students enrolled in the same group, Source Nodes

### Community 166 - "Community 166"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: When an assignment is cloned, what is expected to be done in the frontend? The teacher will only update the dates?, Source Nodes

### Community 167 - "Community 167"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: What happen when a teacher updates the delivery date after a submission of a student that was delivered late? Does the delivery of the student is updated as delivered on time? And does it exist any mechanism to validate for a teacher not to update the dates with a day previous to the current date?, Source Nodes

### Community 168 - "Community 168"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Update teacher due-date flow so qualifying late submissions become on time and past dates are rejected., Source Nodes

### Community 169 - "Community 169"
Cohesion: 0.50
Nodes (4): local infrastructure services, MinIO lifecycle policy, CodeHive, asynchronous execution pipeline

### Community 170 - "Community 170"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 172 - "Community 172"
Cohesion: 0.83
Nodes (3): AspectConfig, Configuration, EnableAspectJAutoProxy

### Community 173 - "Community 173"
Cohesion: 0.83
Nodes (3): CacheConfig, Configuration, EnableCaching

### Community 174 - "Community 174"
Cohesion: 0.83
Nodes (3): Configuration, SchedulingConfig, EnableScheduling

### Community 175 - "Community 175"
Cohesion: 0.50
Nodes (3): TestSuiteUpdateMode, APPEND, REPLACE_ALL

### Community 180 - "Community 180"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 183 - "Community 183"
Cohesion: 1.00
Nodes (3): Welcome email template, Plain-text welcome template, Backend authentication model

## Knowledge Gaps
- **387 isolated node(s):** `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE`, `VALIDATING`, `APPLIED` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **103 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User Entity` to `JWT Authentication Filter`, `Sign-Up Request DTO`, `Execution Job Queue Model`, `User Notification Settings`, `User DTO`, `CSV Bulk Register Response`, `Notification Preferences`, `Admin User Controller`, `Community 149`, `Notification Email Listener`, `Assignment Update Entity`, `Notification Dispatch Log`, `Assignment Entity`, `Execution Entity`, `Notification Format Service`, `Submission Entity`, `Auth Response`, `Community 46`, `Community 49`, `Community 50`, `Community 52`, `Community 53`, `Community 57`, `Community 58`, `Community 59`, `Community 62`, `Community 63`, `Community 79`, `Community 84`, `Community 125`, `Community 127`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `Assignment` connect `Assignment Entity` to `Community 163`, `Community 132`, `Execution Job Queue Model`, `Notification Dispatch Log`, `Reevaluation Batch`, `User Entity`, `Notification Format Service`, `Community 74`, `Submission Entity`, `Community 73`, `Community 70`, `Community 47`, `Community 82`, `Community 51`, `Community 52`, `Assignment Update Entity`, `Community 58`, `Community 92`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `LoginPage()` connect `Community 76` to `Community 48`, `Frontend Protected Route & Admin Pages`, `Auth Response`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `UpdateAssignmentRequest` (e.g. with `.clearingDueDateMarksEveryLateSubmissionOnTime()` and `.extendingDueDateMarksQualifyingLateSubmissionsOnTime()`) actually correct?**
  _`UpdateAssignmentRequest` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `METADATA`, `REFERENCE_ONLY`, `TEST_SUITE` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Assignment Update Requests` be split into smaller, more focused modules?**
  _Cohesion score 0.05204336947456213 - nodes in this community are weakly interconnected._
- **Should `JWT Authentication Filter` be split into smaller, more focused modules?**
  _Cohesion score 0.053776079929473995 - nodes in this community are weakly interconnected._