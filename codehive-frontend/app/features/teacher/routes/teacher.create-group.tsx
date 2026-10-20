import type { Route } from "./+types/teacher.create-group";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { CreateGroupPage } from "../pages/CreateGroupPage";
import { Role } from "~/shared/types/model/User";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Group - CodeHive" },
    { name: "description", content: "Create a new student group." },
  ];
}

export default function TeacherCreateGroup() {
  return (
    <ProtectedRoute roles={[Role.TEACHER]}>
      <CreateGroupPage />
    </ProtectedRoute>
  );
}
