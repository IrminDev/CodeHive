import type { Route } from "./+types/student.assistant-history";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { AssistantHistoryPage } from "../pages/AssistantHistoryPage";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assistant history - CodeHive" }];
}

export default function StudentAssistantHistory() {
  return <ProtectedRoute roles={[Role.STUDENT]}><AssistantHistoryPage /></ProtectedRoute>;
}
