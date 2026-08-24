import type { Route } from "./+types/teacher.groups.$groupId";
import { ManagerRoute } from "../components/ManagerRoute";
import { TeacherGroupDetailPage } from "../pages/TeacherGroupDetailPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Group Detail - CodeHive" },
    { name: "description", content: "View and manage a student group." },
  ];
}

export default function TeacherGroupDetail() {
  return (
    <ManagerRoute>
      <TeacherGroupDetailPage />
    </ManagerRoute>
  );
}
