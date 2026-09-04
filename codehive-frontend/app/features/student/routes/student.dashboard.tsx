import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";

import { StudentDashboardPage } from "../pages/StudentDashboardPage";

export function meta() {
  return [
    { title: "Student Dashboard - CodeHive" },
    { name: "description", content: "CodeHive student dashboard." },
  ];
}

export default function StudentDashboard() {
  return (
    <ProtectedRoute roles={[Role.STUDENT]}>
      <StudentDashboardPage />
    </ProtectedRoute>
  );
}
