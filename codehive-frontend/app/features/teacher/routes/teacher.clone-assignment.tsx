import type { Route } from "./+types/teacher.clone-assignment";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { CreateAssignmentPage } from "../pages/CreateAssignmentPage";
import { Role } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Clone Assignment - CodeHive" },
    { name: "description", content: "Clone and edit an assignment." },
  ];
}

export default function TeacherCloneAssignment({ params }: Route.ComponentProps) {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <CreateAssignmentPage mode="clone" assignmentId={params.assignmentId} />
    </ProtectedRoute>
  );
}
