import { StudentSidebar } from "../components/StudentSidebar";
import { StudentHeader } from "../components/StudentHeader";
import { UsageDashboard } from "~/features/assistant-usage/UsageDashboard";
export function StudentAiUsagePage() {
  return <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100"><StudentSidebar active="ai-usage" /><div className="flex-1 flex flex-col min-w-0"><StudentHeader breadcrumbs={[{ label: "Student" }, { label: "My AI usage" }]} /><main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-7xl mx-auto"><h1 className="text-2xl font-bold mb-5">My AI usage</h1><UsageDashboard audience="personal" /></div></main></div></div>;
}
