import type { Language } from "./assignment.types";

export type SubmissionResultStatus = "AC" | "WA" | "TLE" | "MLE" | "OLE" | "RTE" | "CE" | "PENDING";

export interface RecentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  language: Language;
  executionStatus: SubmissionResultStatus;
  timeMs?: number;
  createdAt: string;
}
