import { studentRequest } from "./client";
import type { StudentAssignmentMetric, StudentGroupMetrics } from "../types/metrics.types";

export function getMyGroupMetrics(groupId: string): Promise<StudentGroupMetrics> {
  return studentRequest<StudentGroupMetrics>(`/api/groups/${encodeURIComponent(groupId)}/metrics/me`);
}

export function listMyAssignmentMetrics(groupId: string): Promise<StudentAssignmentMetric[]> {
  return studentRequest<StudentAssignmentMetric[]>(`/api/groups/${encodeURIComponent(groupId)}/metrics/me/assignments`);
}
