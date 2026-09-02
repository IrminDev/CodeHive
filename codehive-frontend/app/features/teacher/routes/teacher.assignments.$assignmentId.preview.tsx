import type { Route } from "./+types/teacher.assignments.$assignmentId.preview";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { TeacherAssignmentPreviewPage } from "../pages/TeacherAssignmentPreviewPage";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assignment Preview - CodeHive" }];
}

export default function TeacherAssignmentPreview() {
  return <ProtectedRoute roles={[Role.TEACHER]}><TeacherAssignmentPreviewPage /></ProtectedRoute>;
}
