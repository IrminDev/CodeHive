import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";
import type { SuccessResponse } from "~/shared/types/response/Api";

export function teacherAuthHeaders(json = false): HeadersInit {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated. Please sign in again.");
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export async function teacherRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...teacherAuthHeaders(), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = body as { message?: string; error?: string; errors?: string[] };
    throw new Error(error.message || error.error || error.errors?.join(", ") || `HTTP ${response.status}`);
  }
  return (body as SuccessResponse<T>).data;
}

export function jsonRequest(body?: unknown): Pick<RequestInit, "headers" | "body"> {
  return {
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}
