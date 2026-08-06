import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";
import type { ClassGroup } from "../types/group.types";

type ApiResponse<T> = { data: T; message?: string };

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return (body as ApiResponse<T>).data;
}

export async function joinGroup(code: string): Promise<ClassGroup> {
  const res = await fetch(`${API_BASE_URL}/api/groups/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ code }),
  });
  return parseResponse<ClassGroup>(res);
}

export async function listMyGroups(): Promise<ClassGroup[]> {
  const res = await fetch(`${API_BASE_URL}/api/groups/my-groups`, {
    headers: authHeaders(),
  });
  return parseResponse<ClassGroup[]>(res);
}
