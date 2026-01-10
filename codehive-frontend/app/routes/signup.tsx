import type { Route } from "./+types/signup";
import { ThemeProvider } from "../context/ThemeContext";
import { SignUpPage } from "../pages/SignUpPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - CodeHive" },
    { name: "description", content: "Create your CodeHive account. Join classrooms, solve coding challenges, and master programming skills." },
    { property: "og:title", content: "Sign Up - CodeHive" },
    { property: "og:description", content: "Join CodeHive and start your coding journey today." },
  ];
}

export default function SignUp() {
  return (
    <ThemeProvider>
      <SignUpPage />
    </ThemeProvider>
  );
}
