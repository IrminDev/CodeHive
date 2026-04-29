import { route, type RouteConfig } from "@react-router/dev/routes";

export const dashboardRoutes = [
  route("dashboard", "features/dashboard/routes/dashboard.tsx"),
] satisfies RouteConfig;
