import { route, type RouteConfig } from "@react-router/dev/routes";

export const studentRoutes = [
  route("assignment/:id", "features/student/routes/student.assignment.tsx"),
] satisfies RouteConfig;
