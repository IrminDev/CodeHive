import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { SubmissionHistoryPage } from "../pages/SubmissionHistoryPage";
import { Role } from "~/shared/types/model/User";

export function meta() {
  return [
    { title: "Submission History - CodeHive" },
    { name: "description", content: "View your submission history for an assignment." },
  ];
}

export default function StudentSubmissions() {
  return (
    <ProtectedRoute roles={[Role.STUDENT]}>
      <SubmissionHistoryPage />
    </ProtectedRoute>
  );
}
