import { route, type RouteConfig } from "@react-router/dev/routes";

export const teacherRoutes = [
  route("teacher", "features/teacher/routes/teacher.dashboard.tsx"),
  route("teacher/create-assignment", "features/teacher/routes/teacher.create-assignment.tsx"),
] satisfies RouteConfig;
