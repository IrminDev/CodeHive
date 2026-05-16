import { route, type RouteConfig } from "@react-router/dev/routes";

export const studentRoutes = [
  route("dashboard", "features/student/routes/student.dashboard.tsx"),
  route("assignment/:id", "features/student/routes/student.assignment.tsx"),
] satisfies RouteConfig;
