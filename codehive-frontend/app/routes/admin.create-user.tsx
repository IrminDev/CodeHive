import type { Route } from "./+types/admin.create-user";
import { ThemeProvider } from "../context/ThemeContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { CreateUserPage } from "../pages/admin/CreateUserPage";
import { Role } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create User - CodeHive Admin" },
    { name: "description", content: "Register a new user in CodeHive." },
  ];
}

export default function AdminCreateUser() {
  return (
    <ThemeProvider>
      <ProtectedRoute roles={[Role.ADMIN]}>
        <CreateUserPage />
      </ProtectedRoute>
    </ThemeProvider>
  );
}
