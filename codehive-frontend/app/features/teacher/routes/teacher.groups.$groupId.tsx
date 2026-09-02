import type { Route } from "./+types/teacher.groups.$groupId";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { TeacherGroupDetailPage } from "../pages/TeacherGroupDetailPage";
import { Role } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Group Detail - CodeHive" },
    { name: "description", content: "View and manage a student group." },
  ];
}

export default function TeacherGroupDetail() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <TeacherGroupDetailPage />
    </ProtectedRoute>
  );
}
