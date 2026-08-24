import type { Route } from "./+types/teacher";
import { ManagerRoute } from "../components/ManagerRoute";
import { TeacherDashboardPage } from "../pages/TeacherDashboardPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Teacher Dashboard - CodeHive" },
    { name: "description", content: "CodeHive teacher dashboard." },
  ];
}

export default function Teacher() {
  return (
    <ManagerRoute>
      <TeacherDashboardPage />
    </ManagerRoute>
  );
}
