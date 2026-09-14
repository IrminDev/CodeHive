import type { Route } from "./+types/admin.users.$userId";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role, Scope } from "~/shared/types/model/User";
import { AdminUserDetailPage } from "../pages/AdminUserDetailPage";

export function meta({}: Route.MetaArgs) { return [{ title: "User Detail - CodeHive Admin" }]; }
export default function AdminUserDetailRoute() { return <ProtectedRoute roles={[Role.ADMIN]} scopes={[Scope.VIEW_USERS]}><AdminUserDetailPage /></ProtectedRoute>; }
