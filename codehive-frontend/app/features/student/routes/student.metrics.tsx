import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { StudentMetricsPage } from "../pages/StudentMetricsPage";

export function meta() {
  return [
    { title: "Class Progress - CodeHive" },
    { name: "description", content: "Review your progress and assignment performance for this class." },
  ];
}

export default function StudentMetrics() {
  return <ProtectedRoute roles={[Role.STUDENT]}><StudentMetricsPage /></ProtectedRoute>;
}
