import type { Route } from "./+types/teacher.assignments";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
import { TeacherAssignmentsPage } from "../pages/TeacherAssignmentsPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Assignments - CodeHive" },
    { name: "description", content: "Manage and clone assignments." },
  ];
}

export default function TeacherAssignments() {
  return (
    <GroupManagementRoute>
      <TeacherAssignmentsPage />
    </GroupManagementRoute>
  );
}
