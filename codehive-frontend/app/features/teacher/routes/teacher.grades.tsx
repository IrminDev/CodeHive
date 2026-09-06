import type { Route } from "./+types/teacher.grades";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { TeacherGradesPage } from "../pages/TeacherGradesPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Grades and Feedback - CodeHive" },
    { name: "description", content: "Grade assignment work and publish feedback." },
  ];
}

export default function TeacherGrades() {
  return <ProtectedRoute roles={[Role.TEACHER]}><TeacherGradesPage /></ProtectedRoute>;
}
