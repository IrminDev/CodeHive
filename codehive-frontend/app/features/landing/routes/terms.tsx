import { TermsOfServicePage } from "../pages/TermsOfServicePage";

export function meta() {
  return [
    { title: "Terms of Service - CodeHive" },
    { name: "description", content: "Terms for using CodeHive accounts, programming coursework, code execution, and AI assistance." },
  ];
}

export default function Terms() {
  return <TermsOfServicePage />;
}
