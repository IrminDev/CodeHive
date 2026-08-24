import type { Route } from "./+types/teacher.analytics";
import { ManagerRoute } from "../components/ManagerRoute";
import { TeacherAnalyticsPage } from "../pages/TeacherAnalyticsPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Teacher Analytics - CodeHive" },
    { name: "description", content: "Review group, assignment, and student metrics." },
  ];
}

export default function TeacherAnalytics() {
  return <ManagerRoute><TeacherAnalyticsPage /></ManagerRoute>;
}
