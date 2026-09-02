import type { Route } from "./+types/teacher.assignments.$assignmentId.revalidate";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { EditAssignmentPage } from "../pages/EditAssignmentPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Update and Validate Assignment - CodeHive" },
    {
      name: "description",
      content:
        "Update assignment code and private tests with worker validation.",
    },
  ];
}

export default function TeacherRevalidateAssignment() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <EditAssignmentPage validationMode />
    </ProtectedRoute>
  );
}
