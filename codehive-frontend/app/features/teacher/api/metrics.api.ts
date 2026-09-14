import { teacherRequest } from "./client";
import type {
  AssignmentMetrics,
  AssignmentMetricsDetail,
  GroupMetricsOverview,
  StudentMetrics,
} from "../types/metrics.types";

export function getGroupMetricsOverview(groupId: string): Promise<GroupMetricsOverview> {
  return teacherRequest<GroupMetricsOverview>(
    `/api/groups/${encodeURIComponent(groupId)}/metrics/overview`,
  );
}

export function listAssignmentMetrics(groupId: string): Promise<AssignmentMetrics[]> {
  return teacherRequest<AssignmentMetrics[]>(
    `/api/groups/${encodeURIComponent(groupId)}/metrics/assignments`,
  );
}

export function listStudentMetrics(groupId: string): Promise<StudentMetrics[]> {
  return teacherRequest<StudentMetrics[]>(
    `/api/groups/${encodeURIComponent(groupId)}/metrics/students`,
  );
}

export function getAssignmentMetrics(assignmentId: string): Promise<AssignmentMetricsDetail> {
  return teacherRequest<AssignmentMetricsDetail>(
    `/api/assignments/${encodeURIComponent(assignmentId)}/metrics`,
  );
}
