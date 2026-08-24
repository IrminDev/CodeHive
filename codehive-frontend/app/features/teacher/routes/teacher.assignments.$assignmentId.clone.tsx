import type { Route } from "./+types/teacher.assignments.$assignmentId.clone";
import { ManagerRoute } from "../components/ManagerRoute";
import { CloneAssignmentPage } from "../pages/CloneAssignmentPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Clone Assignment - CodeHive" },
    { name: "description", content: "Clone an assignment to another group." },
  ];
}

export default function TeacherCloneAssignment() {
  return (
    <ManagerRoute>
      <CloneAssignmentPage />
    </ManagerRoute>
  );
}
