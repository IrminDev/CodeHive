import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/create-user", "routes/admin.create-user.tsx"),
  route("admin/csv-upload", "routes/admin.csv-upload.tsx"),
] satisfies RouteConfig;
