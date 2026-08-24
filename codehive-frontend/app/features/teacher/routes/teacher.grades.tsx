import type { Route } from "./+types/teacher.grades";
import { ManagerRoute } from "../components/ManagerRoute";
import { TeacherGradesPage } from "../pages/TeacherGradesPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Grades and Feedback - CodeHive" },
    { name: "description", content: "Grade assignment work and publish feedback." },
  ];
}

export default function TeacherGrades() {
  return <ManagerRoute><TeacherGradesPage /></ManagerRoute>;
}
