import { PrivacyPolicyPage } from "../pages/PrivacyPolicyPage";

export function meta() {
  return [
    { title: "Privacy Policy - CodeHive" },
    { name: "description", content: "How CodeHive handles account information, coursework, AI assistance, browser storage, and retention." },
  ];
}

export default function Privacy() {
  return <PrivacyPolicyPage />;
}
