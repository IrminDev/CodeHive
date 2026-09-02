import type { Route } from "./+types/teacher.analytics";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { TeacherAnalyticsPage } from "../pages/TeacherAnalyticsPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Teacher Analytics - CodeHive" },
    { name: "description", content: "Review group, assignment, and student metrics." },
  ];
}

export default function TeacherAnalytics() {
  return <ProtectedRoute roles={[Role.TEACHER]}><TeacherAnalyticsPage /></ProtectedRoute>;
}
