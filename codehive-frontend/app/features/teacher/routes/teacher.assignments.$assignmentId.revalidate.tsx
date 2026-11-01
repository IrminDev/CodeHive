import type { Route } from "./+types/teacher.assignments.$assignmentId.revalidate";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
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
    <GroupManagementRoute>
      <EditAssignmentPage validationMode />
    </GroupManagementRoute>
  );
}
