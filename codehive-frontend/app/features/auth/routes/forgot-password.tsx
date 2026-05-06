import type { Route } from "./+types/forgot-password";
import { RecoveryPasswordPage } from "../pages/RecoveryPasswordPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Password - CodeHive" },
    {
      name: "description",
      content:
        "Reset your CodeHive account password. We'll send you instructions to recover your account.",
    },
    { property: "og:title", content: "Reset Password - CodeHive" },
    {
      property: "og:description",
      content: "Forgot your password? Reset it and get back to coding.",
    },
  ];
}

export default function ForgotPassword() {
  return (
    <RecoveryPasswordPage />
  );
}
