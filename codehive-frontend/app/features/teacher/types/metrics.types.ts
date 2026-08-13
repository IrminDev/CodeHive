import type { AssignmentValidationStatus, Language } from "./assignment.types";
import type { GradeStatus, StudentWorkStatus } from "./student-work.types";

export type ExecutionStatus = "TLE" | "MLE" | "OLE" | "RTE" | "CE" | "WA" | "AC" | "PENDING";

export interface GroupMetricsOverview {
  groupId: string;
  generatedAt: string;
  enrollment: { active: number; left: number; removed: number };
  assignments: { total: number; published: number; processing: number; failed: number };
  overallSubmissionRate: number | null;
  overallAverageScore: number | null;
  overallOnTimeRate: number | null;
  gradingProgress: { submitted: number; graded: number; returned: number };
}

export interface AssignmentMetrics {
  assignmentId: string;
  title: string;
  validationStatus: AssignmentValidationStatus;
  dueDate?: string;
  closeDate?: string;
  maxPoints: number;
  activeStudents: number;
  submittedCount: number;
  submissionRate: number | null;
  lateCount: number;
  onTimeRate: number | null;
  averageScore: number | null;
  averagePoints: number | null;
  draftGrades: number;
  returnedGrades: number;
  averageAttempts: number | null;
  averageDeliveryMarginHours: number | null;
  verdictDistribution: Partial<Record<ExecutionStatus, number>>;
  missingCount: number;
  overdue: boolean;
}

export interface StudentMetrics {
  studentId: string;
  fullName: string;
  enrollmentNumber: string;
  joinedAt: string;
  publishedAssignments: number;
  submittedCount: number;
  completionRate: number | null;
  lateCount: number;
  averageScore: number | null;
  gradedAssignments: number;
  totalAttempts: number;
  missingAssignmentIds: string[];
}

export interface AssignmentMetricsDetail extends AssignmentMetrics {
  languageDistribution: Partial<Record<Language, number>>;
  acceptedPerformance: {
    averageTimeMs: number | null;
    averageMemoryMb: number | null;
    timeLimitMs: number;
    memoryLimitMb: number;
  };
  missingStudents: Array<{ studentId: string; fullName: string; enrollmentNumber: string }>;
  perStudent: Array<{
    studentId: string;
    fullName: string;
    workStatus: StudentWorkStatus;
    currentSubmissionId?: string;
    deliveredLate?: boolean;
    attempts: number;
    verdict?: ExecutionStatus;
    timeMs?: number;
    memoryMb?: number;
    grade?: { value: number; maxPoints: number; status: GradeStatus };
  }>;
}
