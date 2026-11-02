import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { Navigate, useSearchParams } from "react-router";

export function meta() { return [{ title: "Class Progress - CodeHive" }]; }
export default function StudentAiUsage() {
  const [params] = useSearchParams();
  const groupId = params.get("groupId");
  return <ProtectedRoute roles={[Role.STUDENT]}><Navigate replace to={groupId ? `/groups/${encodeURIComponent(groupId)}/metrics#ai-usage` : "/groups"} /></ProtectedRoute>;
}
