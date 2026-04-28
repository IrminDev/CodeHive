import type { Route } from "./+types/dashboard";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { DashboardPage } from "../pages/DashboardPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - CodeHive" },
    { name: "description", content: "CodeHive student dashboard." },
  ];
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
