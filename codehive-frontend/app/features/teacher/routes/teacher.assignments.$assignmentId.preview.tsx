import type { Route } from "./+types/teacher.assignments.$assignmentId.preview";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
import { TeacherAssignmentPreviewPage } from "../pages/TeacherAssignmentPreviewPage";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assignment Preview - CodeHive" }];
}

export default function TeacherAssignmentPreview() {
  return <GroupManagementRoute><TeacherAssignmentPreviewPage /></GroupManagementRoute>;
}
