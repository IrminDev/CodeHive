import type { Route } from "./+types/teacher.groups";
import { ManagerRoute } from "../components/ManagerRoute";
import { TeacherGroupsPage } from "../pages/TeacherGroupsPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Groups - CodeHive" },
    { name: "description", content: "Manage your student groups." },
  ];
}

export default function TeacherGroups() {
  return (
    <ManagerRoute>
      <TeacherGroupsPage />
    </ManagerRoute>
  );
}
