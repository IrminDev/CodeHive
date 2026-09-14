export type StudentMetricWorkStatus = "NOT_SUBMITTED" | "SUBMITTED" | "WITHDRAWN" | "RETURNED";
export type StudentMetricVerdict = "TLE" | "MLE" | "OLE" | "RTE" | "CE" | "WA" | "AC" | "PENDING";

export interface StudentGroupMetrics {
  studentId: string;
  fullName: string;
  enrollmentNumber: string;
  joinedAt?: string;
  publishedAssignments: number;
  submittedCount: number;
  completionRate: number | null;
  lateCount: number;
  averageScore: number | null;
  gradedAssignments: number;
  totalAttempts: number;
  missingAssignmentIds: string[];
}

export interface StudentAssignmentMetric {
  assignmentId: string;
  title: string;
  dueDate?: string;
  closeDate?: string;
  maxPoints: number;
  workStatus: StudentMetricWorkStatus;
  currentSubmissionId?: string;
  deliveredLate?: boolean;
  attempts: number;
  verdict?: StudentMetricVerdict;
  timeMs?: number;
  memoryMb?: number;
  grade?: { value: number; maxPoints: number; status: "RETURNED" };
}
