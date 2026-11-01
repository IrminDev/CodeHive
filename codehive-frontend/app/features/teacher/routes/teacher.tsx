import type { Route } from "./+types/teacher";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
import { TeacherDashboardPage } from "../pages/TeacherDashboardPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Teacher Dashboard - CodeHive" },
    { name: "description", content: "CodeHive teacher dashboard." },
  ];
}

export default function Teacher() {
  return (
    <GroupManagementRoute>
      <TeacherDashboardPage />
    </GroupManagementRoute>
  );
}
