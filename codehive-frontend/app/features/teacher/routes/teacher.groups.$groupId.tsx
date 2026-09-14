import type { Route } from "./+types/teacher.groups.$groupId";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
import { TeacherGroupDetailPage } from "../pages/TeacherGroupDetailPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Group Detail - CodeHive" },
    { name: "description", content: "View and manage a student group." },
  ];
}

export default function TeacherGroupDetail() {
  return (
    <GroupManagementRoute>
      <TeacherGroupDetailPage />
    </GroupManagementRoute>
  );
}
