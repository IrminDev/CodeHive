import type { Route } from "./+types/reset-password";
import { ThemeProvider } from "../context/ThemeContext";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Password - CodeHive" },
    { name: "description", content: "Set a new password for your CodeHive account." },
    { property: "og:title", content: "Reset Password - CodeHive" },
    { property: "og:description", content: "Create a new secure password for your account." },
  ];
}

export default function ResetPassword() {
  return (
    <ThemeProvider>
      <ResetPasswordPage />
    </ThemeProvider>
  );
}
