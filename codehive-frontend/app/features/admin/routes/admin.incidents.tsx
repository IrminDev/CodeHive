import type { Route } from "./+types/admin.incidents";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role, Scope } from "~/shared/types/model/User";
import { AdminIncidentsPage } from "../pages/AdminIncidentsPage";

export function meta({}: Route.MetaArgs) { return [{ title: "Rate-limit Incidents - CodeHive Admin" }]; }
export default function AdminIncidentsRoute() { return <ProtectedRoute roles={[Role.ADMIN]} scopes={[Scope.VIEW_USERS]}><AdminIncidentsPage /></ProtectedRoute>; }
