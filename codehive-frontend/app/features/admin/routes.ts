import { route, type RouteConfig } from "@react-router/dev/routes";

export const adminRoutes = [
  route("admin", "features/admin/routes/admin.tsx"),
  route("admin/users", "features/admin/routes/admin.users.tsx"),
  route("admin/users/:userId", "features/admin/routes/admin.users.$userId.tsx"),
  route("admin/incidents", "features/admin/routes/admin.incidents.tsx"),
  route("admin/audit", "features/admin/routes/admin.audit.tsx"),
  route("admin/create-user", "features/admin/routes/admin.create-user.tsx"),
  route("admin/csv-upload", "features/admin/routes/admin.csv-upload.tsx"),
] satisfies RouteConfig;
