import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role } from "~/shared/types/model/User";
import { NotificationSettingsPage } from "../pages/NotificationSettingsPage";

export function meta() {
  return [
    { title: "Notification Settings - CodeHive" },
    { name: "description", content: "Manage CodeHive email notifications." },
  ];
}

export default function StudentNotifications() {
  return <ProtectedRoute roles={[Role.STUDENT]}><NotificationSettingsPage /></ProtectedRoute>;
}
