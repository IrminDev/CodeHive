import { type RouteConfig } from "@react-router/dev/routes";

import { authRoutes } from "../../features/auth/routes";
import { adminRoutes } from "../../features/admin/routes";
import { landingRoutes } from "../../features/landing/routes";

export const routes = [
  ...landingRoutes,
  ...authRoutes,
  ...adminRoutes,
] satisfies RouteConfig;
