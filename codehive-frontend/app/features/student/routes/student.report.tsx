import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { ExecutionReportPage } from "../pages/ExecutionReportPage";
import { Role } from "~/shared/types/model/User";

export function meta() {
  return [
    { title: "Execution Report - CodeHive" },
    { name: "description", content: "Detailed execution report for a submission." },
  ];
}

export default function StudentReport() {
  return (
    <ProtectedRoute roles={[Role.STUDENT]}>
      <ExecutionReportPage />
    </ProtectedRoute>
  );
}
