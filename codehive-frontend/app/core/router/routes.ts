import { type RouteConfig } from "@react-router/dev/routes";

import { route } from "@react-router/dev/routes";
import { authRoutes } from "../../features/auth/routes";
import { adminRoutes } from "../../features/admin/routes";
import { landingRoutes } from "../../features/landing/routes";
import { dashboardRoutes } from "../../features/dashboard/routes";

export const routes = [
  ...landingRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...dashboardRoutes,
  route(".well-known/appspecific/com.chrome.devtools.json", "core/router/devtools.ts"),
] satisfies RouteConfig;
