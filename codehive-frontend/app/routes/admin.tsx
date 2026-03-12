import type { Route } from "./+types/admin";
import { ThemeProvider } from "../context/ThemeContext";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard - CodeHive" },
    { name: "description", content: "CodeHive administration dashboard." },
  ];
}

export default function Admin() {
  return (
    <ThemeProvider>
      <AdminDashboardPage />
    </ThemeProvider>
  );
}
