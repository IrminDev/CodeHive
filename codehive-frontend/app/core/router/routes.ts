import { type RouteConfig } from "@react-router/dev/routes";
import { authRoutes } from "../../features/auth/routes";
import { adminRoutes } from "../../features/admin/routes";
import { landingRoutes } from "../../features/landing/routes";
import { dashboardRoutes } from "../../features/dashboard/routes";
import { practiceWorkspaceRoutes } from "../../features/practice-workspace/routes";
import { teacherRoutes } from "../../features/teacher/routes/routes";

export const routes = [
  ...landingRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...dashboardRoutes,
  ...practiceWorkspaceRoutes,
  ...teacherRoutes,
] satisfies RouteConfig;
