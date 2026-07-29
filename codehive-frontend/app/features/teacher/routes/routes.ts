import { route, type RouteConfig } from "@react-router/dev/routes";

export const teacherRoutes = [
  route("teacher", "features/teacher/routes/teacher.dashboard.tsx"),
  route("teacher/assignments", "features/teacher/routes/teacher.assignments.tsx"),
  route("teacher/assignments/:assignmentId/clone", "features/teacher/routes/teacher.clone-assignment.tsx"),
  route("teacher/create-assignment", "features/teacher/routes/teacher.create-assignment.tsx"),
] satisfies RouteConfig;
