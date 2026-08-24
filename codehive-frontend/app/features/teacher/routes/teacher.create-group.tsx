import type { Route } from "./+types/teacher.create-group";
import { ManagerRoute } from "../components/ManagerRoute";
import { CreateGroupPage } from "../pages/CreateGroupPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Group - CodeHive" },
    { name: "description", content: "Create a new student group." },
  ];
}

export default function TeacherCreateGroup() {
  return (
    <ManagerRoute>
      <CreateGroupPage />
    </ManagerRoute>
  );
}
