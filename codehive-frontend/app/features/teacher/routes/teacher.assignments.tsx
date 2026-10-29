import type { Route } from "./+types/teacher.assignments";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { TeacherAssignmentsPage } from "../pages/TeacherAssignmentsPage";
import { Role } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Assignments - CodeHive" },
    { name: "description", content: "Manage and clone assignments." },
  ];
}

export default function TeacherAssignments() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <TeacherAssignmentsPage />
    </ProtectedRoute>
  );
}
