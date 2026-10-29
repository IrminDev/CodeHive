import type { Route } from "./+types/teacher.create-assignment";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { CreateAssignmentPage } from "../pages/CreateAssignmentPage";
import { Role } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Assignment - CodeHive" },
    { name: "description", content: "Create a new coding assignment for your students." },
  ];
}

export default function TeacherCreateAssignment() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <CreateAssignmentPage />
    </ProtectedRoute>
  );
}
