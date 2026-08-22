import { studentRequest, jsonBody } from "./client";
import type {
  ExecutionDTO,
  ExecutionReport,
  ExecutionRequest,
} from "../types/execution.types";

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
