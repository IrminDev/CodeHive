import type { Route } from "./+types/admin.users";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role, Scope } from "~/shared/types/model/User";
import { AdminUsersPage } from "../pages/AdminUsersPage";

export function meta({}: Route.MetaArgs) { return [{ title: "Users - CodeHive Admin" }, { name: "description", content: "Manage CodeHive users." }]; }
export default function AdminUsersRoute() { return <ProtectedRoute roles={[Role.ADMIN]} scopes={[Scope.VIEW_USERS, Scope.CREATE_USERS, Scope.CREATE_ADMINS]}><AdminUsersPage /></ProtectedRoute>; }
