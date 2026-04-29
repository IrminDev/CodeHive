import { route, type RouteConfig } from "@react-router/dev/routes";

export const adminRoutes = [
  route("admin", "features/admin/routes/admin.tsx"),
  route("admin/create-user", "features/admin/routes/admin.create-user.tsx"),
  route("admin/csv-upload", "features/admin/routes/admin.csv-upload.tsx"),
] satisfies RouteConfig;
