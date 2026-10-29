import type { Route } from "./+types/teacher.assignments.$assignmentId.edit";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { EditAssignmentPage } from "../pages/EditAssignmentPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Assignment - CodeHive" },
    { name: "description", content: "Edit assignment metadata and schedule." },
  ];
}

export default function TeacherEditAssignment() {
  return <ProtectedRoute roles={[Role.TEACHER]}><EditAssignmentPage /></ProtectedRoute>;
}
