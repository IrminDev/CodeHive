import type { Route } from "./+types/teacher.analytics";
import { GroupManagementRoute } from "../components/GroupManagementRoute";
import { TeacherAnalyticsPage } from "../pages/TeacherAnalyticsPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Teacher Analytics - CodeHive" },
    { name: "description", content: "Review group, assignment, and student metrics." },
  ];
}

export default function TeacherAnalytics() {
  return <GroupManagementRoute><TeacherAnalyticsPage /></GroupManagementRoute>;
}
