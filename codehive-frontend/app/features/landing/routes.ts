import { index, route, type RouteConfig } from "@react-router/dev/routes";

export const landingRoutes = [
  index("features/landing/routes/home.tsx"),
  route("privacy", "features/landing/routes/privacy.tsx"),
  route("terms", "features/landing/routes/terms.tsx"),
] satisfies RouteConfig;
