import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { TeacherDashboardPage } from "../pages/TeacherDashboardPage";
import { Role } from "~/shared/types/model/User";

export function meta() {
  return [
    { title: "Teacher Dashboard - CodeHive" },
    { name: "description", content: "CodeHive teacher dashboard." },
  ];
}

export default function Teacher() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <TeacherDashboardPage />
    </ProtectedRoute>
  );
}
