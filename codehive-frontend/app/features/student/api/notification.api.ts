import { jsonBody, studentRequest } from "./client";

export type NotificationPreference = {
  type: string;
  enabled: boolean;
  reminderLeadMinutes: number | null;
};

export type NotificationSettings = {
  emailEnabled: boolean;
  timezone: string;
  locale: string;
  preferences: NotificationPreference[];
};

export type UpdateNotificationSettings = NotificationSettings;

export function getNotificationSettings(): Promise<NotificationSettings> {
  return studentRequest<NotificationSettings>("/api/notification-preferences");
}

export function updateNotificationSettings(settings: UpdateNotificationSettings): Promise<NotificationSettings> {
  return studentRequest<NotificationSettings>("/api/notification-preferences", {
    method: "PUT",
    ...jsonBody(settings),
  });
}

export function resetNotificationSettings(): Promise<NotificationSettings> {
  return studentRequest<NotificationSettings>("/api/notification-preferences/reset", { method: "POST" });
}

export function sendNotificationTestEmail(): Promise<void> {
  return studentRequest<void>("/api/notification-preferences/test-email", { method: "POST" });
}
