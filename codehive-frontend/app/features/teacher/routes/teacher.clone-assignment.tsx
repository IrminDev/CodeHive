import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { CloneAssignmentPage } from "../pages/CloneAssignmentPage";
import { Role } from "~/shared/types/model/User";

export function meta() {
  return [
    { title: "Clone Assignment - CodeHive" },
    { name: "description", content: "Clone and edit an assignment." },
  ];
}

export default function TeacherCloneAssignment() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <CloneAssignmentPage />
    </ProtectedRoute>
  );
}
