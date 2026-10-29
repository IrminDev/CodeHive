import type { Route } from "./+types/dashboard";
import { StudentDashboardPage } from "~/features/student/pages/StudentDashboardPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - CodeHive" },
    { name: "description", content: "CodeHive student dashboard." },
  ];
}

export default function Dashboard() {
  return <StudentDashboardPage />;
}
