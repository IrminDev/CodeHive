import type { Route } from "./+types/student.assignment";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { AssignmentPage } from "../pages/AssignmentPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Assignment - CodeHive" },
    { name: "description", content: "CodeHive assignment workspace." },
  ];
}

export default function StudentAssignment() {
  return (
    <ProtectedRoute>
      <AssignmentPage />
    </ProtectedRoute>
  );
}
