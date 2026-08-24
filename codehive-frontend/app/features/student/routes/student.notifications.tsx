import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { useAuth } from "~/core/providers/AuthProvider";
import { TeacherNotificationSettingsPage } from "~/features/teacher/pages/TeacherNotificationSettingsPage";
import { NotificationSettingsPage } from "../pages/NotificationSettingsPage";

export function meta() {
  return [
    { title: "Notification Settings - CodeHive" },
    { name: "description", content: "Manage CodeHive email notifications." },
  ];
}

export default function StudentNotifications() {
  return <ProtectedRoute roles={[Role.STUDENT, Role.TEACHER]}><RoleAwareNotifications /></ProtectedRoute>;
}

function RoleAwareNotifications() {
  const { user } = useAuth();
  return user?.role === Role.TEACHER ? <TeacherNotificationSettingsPage /> : <NotificationSettingsPage />;
}
