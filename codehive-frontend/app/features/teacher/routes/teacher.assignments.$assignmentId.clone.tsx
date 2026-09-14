import type { Route } from "./+types/teacher.assignments.$assignmentId.clone";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
import { CloneAssignmentPage } from "../pages/CloneAssignmentPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Clone Assignment - CodeHive" },
    { name: "description", content: "Clone an assignment to another group." },
  ];
}

export default function TeacherCloneAssignment() {
  return (
    <GroupManagementRoute>
      <CloneAssignmentPage />
    </GroupManagementRoute>
  );
}
