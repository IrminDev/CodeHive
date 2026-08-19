import { studentRequest } from "./client";
import type { GroupSubmission } from "../types/group-submission.types";
import type { RecentSubmission } from "../types/submission.types";

export function listRecentSubmissions(limit = 5): Promise<RecentSubmission[]> {
  return studentRequest<RecentSubmission[]>(`/api/submissions/mine?limit=${limit}`);
}

export function listGroupSubmissions(groupId: string): Promise<GroupSubmission[]> {
  return studentRequest<GroupSubmission[]>(`/api/submissions/mine/group/${groupId}`);
}
