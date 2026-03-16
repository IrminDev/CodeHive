import type { Route } from "./+types/admin";
import { ThemeProvider } from "../context/ThemeContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { Role } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard - CodeHive" },
    { name: "description", content: "CodeHive administration dashboard." },
  ];
}

export default function Admin() {
  return (
    <ThemeProvider>
      <ProtectedRoute roles={[Role.ADMIN]}>
        <AdminDashboardPage />
      </ProtectedRoute>
    </ThemeProvider>
  );
}
