import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role, Scope } from "~/shared/types/model/User";
import { AdminAiUsagePage } from "../pages/AdminAiUsagePage";
export function meta() { return [{ title: "AI usage - CodeHive Admin" }]; }
export default function AdminAiUsage() { return <ProtectedRoute roles={[Role.ADMIN]} scopes={[Scope.CHECK_ANALYTICS]}><AdminAiUsagePage /></ProtectedRoute>; }
