import type { Route } from "./+types/admin.audit";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role, Scope } from "~/shared/types/model/User";
import { AdminAuditPage } from "../pages/AdminAuditPage";

export function meta({}: Route.MetaArgs) { return [{ title: "Audit History - CodeHive Admin" }]; }
export default function AdminAuditRoute() { return <ProtectedRoute roles={[Role.ADMIN]} scopes={[Scope.VIEW_AUDIT_LOG]}><AdminAuditPage /></ProtectedRoute>; }
