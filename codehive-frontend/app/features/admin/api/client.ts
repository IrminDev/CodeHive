import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";
import type { SuccessResponse } from "~/shared/types/response/Api";

export class AdminApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details: string[] = [], public readonly retryAfter?: number, public readonly policy?: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

export async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new AdminApiError("Your session has expired. Please sign in again.", 401);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = body as { message?: string; error?: string; errors?: string[] };
    const retryHeader = response.headers.get("Retry-After");
    throw new AdminApiError(
      error.message || error.error || error.errors?.join(", ") || `HTTP ${response.status}`,
      response.status,
      error.errors ?? [],
      retryHeader ? Number.parseInt(retryHeader, 10) : undefined,
      response.headers.get("X-RateLimit-Policy") ?? undefined,
    );
  }
  return (body as SuccessResponse<T>).data;
}

export function jsonPatch(body: unknown): RequestInit {
  return { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export function queryString(values: object): string {
  const params = new URLSearchParams();
  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}
