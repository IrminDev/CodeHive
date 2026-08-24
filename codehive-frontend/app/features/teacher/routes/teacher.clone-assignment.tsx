import { ManagerRoute } from "../components/ManagerRoute";
import { CloneAssignmentPage } from "../pages/CloneAssignmentPage";

export function meta() {
  return [
    { title: "Clone Assignment - CodeHive" },
    { name: "description", content: "Clone and edit an assignment." },
  ];
}

export default function TeacherCloneAssignment() {
  return (
    <ManagerRoute>
      <CloneAssignmentPage />
    </ManagerRoute>
  );
}
