import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";

type SuccessResponse<T> = { data: T; message?: string };
type ErrorResponse = { message?: string; error?: string; errors?: string[] };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: string[]) {
    super(message);
    this.name = "ApiError";
  }
}

export function studentAuthHeaders(json = false): HeadersInit {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export async function studentRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...studentAuthHeaders(), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = body as ErrorResponse;
    throw new ApiError(err.message ?? err.error ?? `HTTP ${response.status}`, response.status, err.errors);
  }
  return (body as SuccessResponse<T>).data;
}

export function jsonBody(data: unknown): Pick<RequestInit, "headers" | "body"> {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
