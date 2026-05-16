import { type RouteConfig } from "@react-router/dev/routes";
import { authRoutes } from "../../features/auth/routes";
import { adminRoutes } from "../../features/admin/routes";
import { landingRoutes } from "../../features/landing/routes";
import { teacherRoutes } from "../../features/teacher/routes/routes";
import { studentRoutes } from "../../features/student/routes/routes";

export const routes = [
  ...landingRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...teacherRoutes,
  ...studentRoutes,
] satisfies RouteConfig;
