# Graph Report - codehive-frontend  (2026-08-18)

## Corpus Check
- 122 files · ~58,344 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 661 nodes · 1375 edges · 31 communities (29 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ac7f36f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ProtectedRoute.tsx
- AssignmentPage.tsx
- teacher/api/assignment.api.ts
- dependencies
- StudentDashboardPage.tsx
- CodeHive Design System
- auth.api.ts
- devDependencies
- CreateAssignmentPage.tsx
- Select.tsx
- compilerOptions
- TeacherAssignmentPreviewPage.tsx
- TeacherGroupDetailPage.tsx
- teacherRequest
- LandingPage.tsx
- TeacherAnalyticsPage.tsx
- AppHeader.tsx
- TeacherDashboardPage.tsx
- ThemeProvider.tsx
- AuthService
- student/api/client.ts
- AuthProvider.tsx
- useTheme
- Arquitectura Frontend - CodeHive
- useAuth
- README.md
- dashboard.types.ts
- DashboardGroup.ts

## God Nodes (most connected - your core abstractions)
1. `teacherRequest()` - 35 edges
2. `useAuth()` - 31 edges
3. `Role` - 30 edges
4. `useTheme()` - 27 edges
5. `ProtectedRoute()` - 24 edges
6. `AuthService` - 15 edges
7. `studentRequest()` - 15 edges
8. `compilerOptions` - 15 edges
9. `TeacherGroupDetailPage()` - 14 edges
10. `CodeHive Design System` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ThemedToaster()` --calls--> `useTheme()`  [EXTRACTED]
  app/root.tsx → app/core/providers/ThemeProvider.tsx
- `getAssignmentUpdate()` --calls--> `teacherRequest()`  [EXTRACTED]
  app/features/teacher/api/assignment.api.ts → app/features/teacher/api/client.ts
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  app/core/components/ProtectedRoute.tsx → app/core/providers/AuthProvider.tsx
- `AuthContextType` --references--> `User`  [EXTRACTED]
  app/core/providers/AuthProvider.tsx → app/shared/types/model/User.ts
- `AuthProvider()` --calls--> `getAuthToken()`  [EXTRACTED]
  app/core/providers/AuthProvider.tsx → app/core/storage/token.storage.ts

## Import Cycles
- None detected.

## Communities (31 total, 2 thin omitted)

### Community 0 - "ProtectedRoute.tsx"
Cohesion: 0.05
Nodes (7): ProtectedRoute(), ProtectedRouteProps, AuthContextType, CreateGroupPage(), getDashboardRoute(), Role, Scope

### Community 1 - "AssignmentPage.tsx"
Cohesion: 0.05
Nodes (43): getAssignment(), listAssignments(), listAssignmentsForGroups(), ApiResponse, authHeaders(), getExecution(), getExecutionReport(), listSubmissions() (+35 more)

### Community 2 - "teacher/api/assignment.api.ts"
Cohesion: 0.09
Nodes (37): cloneAssignment(), createAssignment(), deleteAssignment(), getActiveTeacherGroups(), getAssignmentUpdate(), getCloneAssignmentForm(), getTeacherAssignment(), getTeacherAssignmentPage() (+29 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (41): class-variance-authority, clsx, framer-motion, isbot, lucide-react, monaco-editor, @monaco-editor/react, dependencies (+33 more)

### Community 4 - "StudentDashboardPage.tsx"
Cohesion: 0.09
Nodes (25): jsonBody(), studentRequest(), submitExecution(), joinGroup(), listMyGroups(), listRecentSubmissions(), GroupCardProps, BADGE_COLORS (+17 more)

### Community 5 - "CodeHive Design System"
Cohesion: 0.06
Nodes (35): Accessibility, Ambient Gradient Orbs, Animations, Backgrounds & Decorations, Badge / Label Pill, Brand Colors, Buttons, Card Top Accent (+27 more)

### Community 6 - "auth.api.ts"
Cohesion: 0.15
Nodes (21): CsvUploadPage(), CsvProgressMessage, CsvTaskResponse, forgotPassword(), getMe(), login(), resetPassword(), signUp() (+13 more)

### Community 7 - "devDependencies"
Cohesion: 0.07
Nodes (27): devDependencies, @react-router/dev, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+19 more)

### Community 8 - "CreateAssignmentPage.tsx"
Cohesion: 0.09
Nodes (12): byteSize(), CreateAssignmentPage(), EXT_TO_LANG, LANGUAGE_TEMPLATES, LANGUAGES, lineCount(), SolutionMode, TestCaseEntry (+4 more)

### Community 9 - "Select.tsx"
Cohesion: 0.10
Nodes (19): Badge(), BadgeProps, badgeVariants, Button, ButtonProps, buttonVariants, SelectContent, SelectItem (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.08
Nodes (25): **/*, **/.client/**/*, DOM, DOM.Iterable, ES2022, node, .react-router/types/**/*, **/.server/**/* (+17 more)

### Community 11 - "TeacherAssignmentPreviewPage.tsx"
Cohesion: 0.13
Nodes (16): STUDENT_NAV, STUDENT_SIDEBAR_ITEMS, STUDENT_STATS_ICONS, getTeacherAssignmentPreview(), TEACHER_CREATE_NAV, TEACHER_CREATE_SIDEBAR_ITEMS, TEACHER_NAV, TEACHER_SIDEBAR_ITEMS (+8 more)

### Community 12 - "TeacherGroupDetailPage.tsx"
Cohesion: 0.24
Nodes (19): archiveGroup(), deleteGroup(), getTeacherGroup(), groupPath(), listGroupStudents(), removeGroupStudent(), restoreGroup(), rotateGroupJoinCode() (+11 more)

### Community 13 - "teacherRequest"
Cohesion: 0.24
Nodes (17): jsonRequest(), teacherRequest(), createGroup(), assignmentPath(), createFeedback(), deleteFeedback(), getStudentWork(), listFeedback() (+9 more)

### Community 14 - "LandingPage.tsx"
Cohesion: 0.17
Nodes (8): Features, Footer(), footerLinks, socialLinks, Hero(), HowItWorks(), steps, LandingPage()

### Community 15 - "TeacherAnalyticsPage.tsx"
Cohesion: 0.28
Nodes (13): getAssignmentMetrics(), listAssignmentMetrics(), listStudentMetrics(), percentage(), TeacherAnalyticsPage(), AssignmentValidationStatus, AssignmentMetrics, AssignmentMetricsDetail (+5 more)

### Community 16 - "AppHeader.tsx"
Cohesion: 0.16
Nodes (7): DashboardLayoutProps, STUDENT_NAV, TEACHER_NAV, TeacherLayoutProps, AppHeader(), AppHeaderProps, NavLink

### Community 17 - "TeacherDashboardPage.tsx"
Cohesion: 0.24
Nodes (10): getTeacherAssignments(), listTeacherGroups(), getGroupMetricsOverview(), TeacherDashboardPage(), TeacherGradesPage(), GroupCardData, GroupTab, initials() (+2 more)

### Community 18 - "ThemeProvider.tsx"
Cohesion: 0.20
Nodes (6): getInitialTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), ThemedToaster()

### Community 19 - "AuthService"
Cohesion: 0.23
Nodes (6): CreateUserPage(), ROLE_OPTIONS, ResetPasswordPage(), AuthService, ProfileSettingsModal(), ProfileSettingsModalProps

### Community 20 - "student/api/client.ts"
Cohesion: 0.27
Nodes (7): getAuthToken(), updatePassword(), ProfileSettingsModal(), ProfileSettingsModalProps, ErrorResponse, studentAuthHeaders(), SuccessResponse

### Community 21 - "AuthProvider.tsx"
Cohesion: 0.29
Nodes (5): AuthContext, AuthProvider(), removeAuthToken(), setAuthToken(), LoginPage()

### Community 22 - "useTheme"
Cohesion: 0.27
Nodes (5): useTheme(), AdminLayout(), AdminLayoutProps, NAV_ITEMS, RecoveryPasswordPage()

### Community 23 - "Arquitectura Frontend - CodeHive"
Cohesion: 0.20
Nodes (9): 1. Estructura del Proyecto, 2. Convenciones de Nomenclatura, 3. Organización de una Feature, 4. Guía para Nuevos Módulos, 5. Estándares de Implementación, app/core/, app/features/, app/shared/ (+1 more)

### Community 24 - "useAuth"
Cohesion: 0.32
Nodes (6): useAuth(), AdminDashboardPage(), NAV_CARDS, STATS, Header(), AssignmentPage()

### Community 26 - "README.md"
Cohesion: 0.29
Nodes (6): Docker, Ejecutar en desarrollo (local), Ejecutar en producción (local), Requisitos, Scripts útiles, Variables de entorno

## Knowledge Gaps
- **185 isolated node(s):** `AuthContext`, `Theme`, `ThemeContextType`, `ThemeContext`, `AdminLayoutProps` (+180 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `ProtectedRoute.tsx`, `AssignmentPage.tsx`, `StudentDashboardPage.tsx`, `CreateAssignmentPage.tsx`, `AppHeader.tsx`, `TeacherDashboardPage.tsx`, `AuthService`, `student/api/client.ts`, `AuthProvider.tsx`, `useTheme`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `AssignmentPage.tsx`, `StudentDashboardPage.tsx`, `CreateAssignmentPage.tsx`, `AppHeader.tsx`, `ThemeProvider.tsx`, `AuthService`, `AuthProvider.tsx`, `useAuth`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Role` connect `ProtectedRoute.tsx` to `AuthService`, `AuthProvider.tsx`, `auth.api.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `AuthContext`, `Theme`, `ThemeContextType` to the rest of the system?**
  _185 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ProtectedRoute.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0547945205479452 - nodes in this community are weakly interconnected._
- **Should `AssignmentPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051360842844600525 - nodes in this community are weakly interconnected._
- **Should `teacher/api/assignment.api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08787878787878788 - nodes in this community are weakly interconnected._