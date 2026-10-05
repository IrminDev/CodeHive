# Graph Report - codehive-frontend  (2026-08-18)

## Corpus Check
- 130 files · ~62,309 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 698 nodes · 1475 edges · 24 communities (22 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
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
- Arquitectura Frontend - CodeHive
- README.md
- dashboard.types.ts
- DashboardGroup.ts

## God Nodes (most connected - your core abstractions)
1. `teacherRequest()` - 35 edges
2. `useAuth()` - 33 edges
3. `Role` - 33 edges
4. `ProtectedRoute()` - 27 edges
5. `useTheme()` - 25 edges
6. `studentRequest()` - 17 edges
7. `AuthService` - 15 edges
8. `compilerOptions` - 15 edges
9. `TeacherGroupDetailPage()` - 14 edges
10. `CodeHive Design System` - 12 edges

## Surprising Connections (you probably didn't know these)
- `getAssignmentUpdate()` --calls--> `teacherRequest()`  [EXTRACTED]
  app/features/teacher/api/assignment.api.ts → app/features/teacher/api/client.ts
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  app/core/components/ProtectedRoute.tsx → app/core/providers/AuthProvider.tsx
- `AuthContextType` --references--> `User`  [EXTRACTED]
  app/core/providers/AuthProvider.tsx → app/shared/types/model/User.ts
- `Header()` --calls--> `useAuth()`  [EXTRACTED]
  app/features/landing/components/Header.tsx → app/core/providers/AuthProvider.tsx
- `StudentHeader()` --calls--> `useAuth()`  [EXTRACTED]
  app/features/student/components/StudentHeader.tsx → app/core/providers/AuthProvider.tsx

## Import Cycles
- None detected.

## Communities (24 total, 2 thin omitted)

### Community 0 - "ProtectedRoute.tsx"
Cohesion: 0.05
Nodes (7): ProtectedRoute(), ProtectedRouteProps, AuthContextType, Header(), getDashboardRoute(), Role, Scope

### Community 1 - "AssignmentPage.tsx"
Cohesion: 0.06
Nodes (36): getAssignment(), ApiResponse, getExecution(), getExecutionReport(), listSubmissions(), AiMessage, AssignmentPage(), LANGUAGE_FILE (+28 more)

### Community 2 - "teacher/api/assignment.api.ts"
Cohesion: 0.16
Nodes (19): createAssignment(), deleteAssignment(), getAssignmentUpdate(), multipartMetadata(), multipartRequest(), updateAssignment(), AssignmentExample, AssignmentPage (+11 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (41): class-variance-authority, clsx, framer-motion, isbot, lucide-react, monaco-editor, @monaco-editor/react, dependencies (+33 more)

### Community 4 - "StudentDashboardPage.tsx"
Cohesion: 0.06
Nodes (51): listAssignments(), listAssignmentsForGroups(), ErrorResponse, jsonBody(), studentAuthHeaders(), studentRequest(), SuccessResponse, submitExecution() (+43 more)

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
Nodes (11): byteSize(), CreateAssignmentPage(), EXT_TO_LANG, LANGUAGE_TEMPLATES, LANGUAGES, lineCount(), PublishMode, SolutionMode (+3 more)

### Community 9 - "Select.tsx"
Cohesion: 0.10
Nodes (19): Badge(), BadgeProps, badgeVariants, Button, ButtonProps, buttonVariants, SelectContent, SelectItem (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.08
Nodes (25): **/*, **/.client/**/*, DOM, DOM.Iterable, ES2022, node, .react-router/types/**/*, **/.server/**/* (+17 more)

### Community 11 - "TeacherAssignmentPreviewPage.tsx"
Cohesion: 0.21
Nodes (6): getTeacherAssignmentPreview(), formatDate(), MONACO_LANGUAGE, TeacherAssignmentPreviewPage(), CodeEditor(), CodeEditorProps

### Community 12 - "TeacherGroupDetailPage.tsx"
Cohesion: 0.06
Nodes (75): STUDENT_NAV, STUDENT_SIDEBAR_ITEMS, STUDENT_STATS_ICONS, getTeacherAssignmentPage(), getTeacherAssignments(), jsonRequest(), teacherRequest(), archiveGroup() (+67 more)

### Community 13 - "teacherRequest"
Cohesion: 0.17
Nodes (10): getTeacherAssignment(), normalizeAssignment(), byteSize(), currentMinimumDate(), EditableTestCase, EditAssignmentPage(), EXT_TO_LANG, LANGUAGES (+2 more)

### Community 14 - "LandingPage.tsx"
Cohesion: 0.17
Nodes (8): Features, Footer(), footerLinks, socialLinks, Hero(), HowItWorks(), steps, LandingPage()

### Community 15 - "TeacherAnalyticsPage.tsx"
Cohesion: 0.27
Nodes (9): cloneAssignment(), getActiveTeacherGroups(), getCloneAssignmentForm(), CloneAssignmentPage(), csv(), fieldClass(), LANGUAGES, localDateTimeMinimum() (+1 more)

### Community 16 - "AppHeader.tsx"
Cohesion: 0.05
Nodes (38): AuthContext, AuthProvider(), useAuth(), getInitialTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider() (+30 more)

### Community 23 - "Arquitectura Frontend - CodeHive"
Cohesion: 0.20
Nodes (9): 1. Estructura del Proyecto, 2. Convenciones de Nomenclatura, 3. Organización de una Feature, 4. Guía para Nuevos Módulos, 5. Estándares de Implementación, app/core/, app/features/, app/shared/ (+1 more)

### Community 26 - "README.md"
Cohesion: 0.29
Nodes (6): Docker, Ejecutar en desarrollo (local), Ejecutar en producción (local), Requisitos, Scripts útiles, Variables de entorno

## Knowledge Gaps
- **191 isolated node(s):** `AuthContext`, `Theme`, `ThemeContextType`, `ThemeContext`, `AdminLayoutProps` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `AppHeader.tsx` to `ProtectedRoute.tsx`, `AssignmentPage.tsx`, `StudentDashboardPage.tsx`, `CreateAssignmentPage.tsx`, `TeacherGroupDetailPage.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `Role` connect `ProtectedRoute.tsx` to `AppHeader.tsx`, `TeacherGroupDetailPage.tsx`, `auth.api.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `AppHeader.tsx` to `ProtectedRoute.tsx`, `AssignmentPage.tsx`, `StudentDashboardPage.tsx`, `CreateAssignmentPage.tsx`, `TeacherAssignmentPreviewPage.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `AuthContext`, `Theme`, `ThemeContextType` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ProtectedRoute.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.052289815447710185 - nodes in this community are weakly interconnected._
- **Should `AssignmentPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.056107539450613676 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._