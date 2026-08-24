import { ManagerRoute } from "../components/ManagerRoute";
import { TeacherDashboardPage } from "../pages/TeacherDashboardPage";

export function meta() {
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
