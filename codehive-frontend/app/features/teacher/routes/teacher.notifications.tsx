import type { Route } from "./+types/teacher.notifications";
import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { TeacherNotificationSettingsPage } from "../pages/TeacherNotificationSettingsPage";

export function meta({}: Route.MetaArgs) { return [{ title: "Teacher Notifications - CodeHive" }]; }
export default function TeacherNotifications() { return <ProtectedRoute roles={[Role.TEACHER]}><TeacherNotificationSettingsPage /></ProtectedRoute>; }
