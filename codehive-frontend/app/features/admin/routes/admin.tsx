import type { Route } from "./+types/admin";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { Role } from "~/shared/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard - CodeHive" },
    { name: "description", content: "CodeHive administration dashboard." },
  ];
}

export default function Admin() {
  return (
    <ProtectedRoute roles={[Role.ADMIN]}>
      <AdminDashboardPage />
    </ProtectedRoute>
  );
}
