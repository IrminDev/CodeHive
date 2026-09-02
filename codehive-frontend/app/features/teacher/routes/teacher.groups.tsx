import type { Route } from "./+types/teacher.groups";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { TeacherGroupsPage } from "../pages/TeacherGroupsPage";
import { Role } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Groups - CodeHive" },
    { name: "description", content: "Manage your student groups." },
  ];
}

export default function TeacherGroups() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <TeacherGroupsPage />
    </ProtectedRoute>
  );
}
