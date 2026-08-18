import { studentRequest, jsonBody } from "./client";
import type {
  ExecutionDTO,
  ExecutionReport,
  ExecutionRequest,
  Submission,
} from "../types/execution.types";

type ApiResponse<T> = { data: T; message?: string }

function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function submitExecution(request: ExecutionRequest): Promise<ExecutionDTO> {
  return studentRequest<ExecutionDTO>("/api/execution/check", {
    method: "POST",
    ...jsonBody(request),
  });
}

export async function getExecution(id: string): Promise<ExecutionDTO> {
  return studentRequest<ExecutionDTO>(`/api/execution/check/${id}`);
}

export async function getExecutionReport(id: string): Promise<ExecutionReport> {
  return studentRequest<ExecutionReport>(`/api/execution/check/${id}/report`);
}

export async function listSubmissions(assignmentId: string): Promise<Submission[]> {
  return studentRequest<Submission[]>(`/api/submissions/assignment/${assignmentId}`);
}

export async function listSubmissions(assignmentId: string): Promise<Submission[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/submissions/assignment/${assignmentId}`,
    { headers: authHeaders() },
  )
  return parseResponse<Submission[]>(res)
}
