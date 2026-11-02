import { teacherRequest } from "~/features/teacher/api/client";
import { studentRequest } from "~/features/student/api/client";
import { adminRequest } from "~/features/admin/api/client";
import type { Audience, GroupOption } from "./types";
export function usageRequest<T>(audience: Audience, path: string, signal?: AbortSignal): Promise<T> {
  const request = audience === "owner" ? teacherRequest : audience === "personal" ? studentRequest : adminRequest;
  return request<T>(path, { signal });
}
export function ownedUsageGroups(signal?: AbortSignal) {
  return teacherRequest<GroupOption[]>("/api/assistant-usage/owned-groups", { signal });
}
export function usageQuery(values: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return query.size ? `?${query}` : "";
}
