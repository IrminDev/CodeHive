import { AdminShell } from "../components/AdminShell";
import { AdminPageHeader } from "../components/AdminUI";
import { UsageDashboard } from "~/features/assistant-usage/UsageDashboard";
export function AdminAiUsagePage() {
  return <AdminShell active="ai-usage" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "AI usage" }]}>
    <AdminPageHeader eyebrow="Assistant analytics" title="AI usage" description="Understand student activity, delivered answers, and provider consumption." />
    <UsageDashboard audience="admin" presentation="admin" />
  </AdminShell>;
}
