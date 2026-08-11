import type { Route } from "./+types/student.assignment";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { AssignmentPage } from "../pages/AssignmentPage";
import { Role } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Assignment - CodeHive" },
    { name: "description", content: "CodeHive assignment workspace." },
  ];
}

export default function StudentAssignment() {
  return (
    <ProtectedRoute roles={[Role.STUDENT]}>
      <AssignmentPage />
    </ProtectedRoute>
  );
}
