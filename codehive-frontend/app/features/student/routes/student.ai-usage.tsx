import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { StudentAiUsagePage } from "../pages/StudentAiUsagePage";
export function meta() { return [{ title: "My AI usage - CodeHive" }]; }
export default function StudentAiUsage() { return <ProtectedRoute roles={[Role.STUDENT]}><StudentAiUsagePage /></ProtectedRoute>; }
