import type { Route } from "./+types/teacher.assignments.$assignmentId.preview";
import { ManagerRoute } from "../components/ManagerRoute";
import { TeacherAssignmentPreviewPage } from "../pages/TeacherAssignmentPreviewPage";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assignment Preview - CodeHive" }];
}

export default function TeacherAssignmentPreview() {
  return <ManagerRoute><TeacherAssignmentPreviewPage /></ManagerRoute>;
}
