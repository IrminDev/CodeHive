import type { Route } from "./+types/admin.create-user";
import { ThemeProvider } from "../context/ThemeContext";
import { CreateUserPage } from "../pages/admin/CreateUserPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create User - CodeHive Admin" },
    { name: "description", content: "Register a new user in CodeHive." },
  ];
}

export default function AdminCreateUser() {
  return (
    <ThemeProvider>
      <CreateUserPage />
    </ThemeProvider>
  );
}
