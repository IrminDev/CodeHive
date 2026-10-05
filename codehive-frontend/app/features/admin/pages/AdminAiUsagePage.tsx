import { AdminShell } from "../components/AdminShell";
import { AdminPageHeader } from "../components/AdminUI";
import { UsageDashboard } from "~/features/assistant-usage/UsageDashboard";
export function AdminAiUsagePage() { return <AdminShell active="ai-usage" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "AI usage" }]}><AdminPageHeader eyebrow="Assistant" title="AI usage" description="Educational answers and measured provider work, including historical activity." /><UsageDashboard audience="admin" /></AdminShell>; }
