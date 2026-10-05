import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { MyAssignmentsPage } from "../pages/MyAssignmentsPage";

export function meta() {
  return [
    { title: "My Assignments - CodeHive" },
    { name: "description", content: "Track your CodeHive assignments and submissions." },
  ];
}

export default function StudentAssignments() {
  return <ProtectedRoute roles={[Role.STUDENT]}><MyAssignmentsPage /></ProtectedRoute>;
}
