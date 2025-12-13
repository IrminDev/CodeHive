import type { Route } from "./+types/login";
import { ThemeProvider } from "../context/ThemeContext";
import { LoginPage } from "../pages/LoginPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In - CodeHive" },
    { name: "description", content: "Sign in to your CodeHive account. Access your classrooms, coding challenges, and track your progress." },
    { property: "og:title", content: "Sign In - CodeHive" },
    { property: "og:description", content: "Sign in to CodeHive and continue your coding journey." },
  ];
}

export default function Login() {
  return (
    <ThemeProvider>
      <LoginPage />
    </ThemeProvider>
  );
}
