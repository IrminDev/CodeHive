import { route, type RouteConfig } from "@react-router/dev/routes";

export const authRoutes = [
  route("login", "features/auth/routes/login.tsx"),
  route("forgot-password", "features/auth/routes/forgot-password.tsx"),
  route("reset-password", "features/auth/routes/reset-password.tsx"),
] satisfies RouteConfig;
