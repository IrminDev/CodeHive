import type { Route } from "./+types/teacher.assignments.$assignmentId.edit";
import { ManagerRoute } from "../components/ManagerRoute";
import { EditAssignmentPage } from "../pages/EditAssignmentPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Assignment - CodeHive" },
    { name: "description", content: "Edit assignment metadata and schedule." },
  ];
}

export default function TeacherEditAssignment() {
  return <ManagerRoute><EditAssignmentPage /></ManagerRoute>;
}
