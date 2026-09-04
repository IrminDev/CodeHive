import { route, type RouteConfig } from "@react-router/dev/routes";

export const studentRoutes = [
  route("assignment/:id", "features/student/routes/student.assignment.tsx"),
  route("assignment/:id/submissions", "features/student/routes/student.submissions.tsx"),
  route("assignment/:id/report/:executionId", "features/student/routes/student.report.tsx"),
  route("assignments", "features/student/routes/student.assignments.tsx"),
  route("grades", "features/student/routes/student.grades.tsx"),
  route("groups", "features/student/routes/student.groups.tsx"),
  route("groups/join", "features/student/routes/student.join-group.tsx"),
  route("groups/:groupId", "features/student/routes/student.group.tsx"),
  route("notifications", "features/student/routes/student.notifications.tsx"),
] satisfies RouteConfig;
