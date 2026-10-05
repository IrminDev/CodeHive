import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { StudentGroupDetailPage } from "../pages/StudentGroupDetailPage";

export function meta() {
  return [
    { title: "Group - CodeHive" },
    { name: "description", content: "Group assignments and delivery progress." },
  ];
}

export default function StudentGroup() {
  return (
    <ProtectedRoute roles={[Role.STUDENT]}>
      <StudentGroupDetailPage />
    </ProtectedRoute>
  );
}
