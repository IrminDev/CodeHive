import type { Route } from "./+types/teacher.create-assignment";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
import { CreateAssignmentPage } from "../pages/CreateAssignmentPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Assignment - CodeHive" },
    { name: "description", content: "Create a new coding assignment for your students." },
  ];
}

export default function TeacherCreateAssignment() {
  return (
    <GroupManagementRoute>
      <CreateAssignmentPage />
    </GroupManagementRoute>
  );
}
