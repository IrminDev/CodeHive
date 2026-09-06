import type { Route } from "./+types/dashboard";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { StudentDashboardPage } from "~/features/student/pages/StudentDashboardPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - CodeHive" },
    { name: "description", content: "CodeHive student dashboard." },
  ];
}

export default function Dashboard() {
  return (
    <ProtectedRoute roles={[Role.STUDENT]}>
      <StudentDashboardPage />
    </ProtectedRoute>
  );
}
