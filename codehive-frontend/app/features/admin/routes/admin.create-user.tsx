import type { Route } from "./+types/admin.create-user";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { CreateUserPage } from "../pages/CreateUserPage";
import { Role } from "~/shared/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create User - CodeHive Admin" },
    { name: "description", content: "Register a new user in CodeHive." },
  ];
}

export default function AdminCreateUser() {
  return (
    <ProtectedRoute roles={[Role.ADMIN]}>
      <CreateUserPage />
    </ProtectedRoute>
  );
}
