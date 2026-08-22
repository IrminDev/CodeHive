import { studentRequest } from "./client";
import type { GroupSubmission } from "../types/group-submission.types";
import type { RecentSubmission } from "../types/submission.types";
import type { StudentSubmissionHistory } from "../types/execution.types";

export function listRecentSubmissions(limit = 5): Promise<RecentSubmission[]> {
  return studentRequest<RecentSubmission[]>(`/api/submissions/mine?limit=${limit}`);
}

export function listGroupSubmissions(groupId: string): Promise<GroupSubmission[]> {
  return studentRequest<GroupSubmission[]>(`/api/submissions/mine/group/${groupId}`);
}

export function listAssignmentSubmissions(assignmentId: string): Promise<StudentSubmissionHistory[]> {
  return studentRequest<StudentSubmissionHistory[]>(`/api/submissions/mine/assignment/${assignmentId}`);
}

export function withdrawSubmission(submissionId: string): Promise<void> {
  return studentRequest<void>(`/api/submissions/${submissionId}/withdraw`, { method: "POST" });
}
