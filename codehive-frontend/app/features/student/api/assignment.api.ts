import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";
import type { Assignment, AssignmentPage } from "../types/assignment.types";

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

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`${API_BASE_URL}/api/assignments/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse<Assignment>(res);
}

export async function listAssignments(page = 0, size = 12): Promise<AssignmentPage> {
  const res = await fetch(`${API_BASE_URL}/api/assignments?page=${page}&size=${size}`, {
    headers: authHeaders(),
  });
  return parseResponse<AssignmentPage>(res);
}

export async function getSampleInputs(assignmentId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/sample-inputs`, {
    headers: authHeaders(),
  });
  return parseResponse<string[]>(res);
}
