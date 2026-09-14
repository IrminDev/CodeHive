import { teacherRequest } from "./client";
import type { TeacherDashboardData } from "../types/dashboard.types";

export function getTeacherDashboard(): Promise<TeacherDashboardData> {
  return teacherRequest<TeacherDashboardData>("/api/teacher/dashboard");
}
