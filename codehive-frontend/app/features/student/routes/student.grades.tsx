import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { GradesPage } from "../pages/GradesPage";

export function meta() {
  return [
    { title: "My Grades - CodeHive" },
    { name: "description", content: "Review returned grades and teacher feedback." },
  ];
}

export default function StudentGrades() {
  return <ProtectedRoute roles={[Role.STUDENT]}><GradesPage /></ProtectedRoute>;
}
