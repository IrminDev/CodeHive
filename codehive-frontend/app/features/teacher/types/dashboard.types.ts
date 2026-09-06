import type { AssignmentValidationStatus, Language } from "./assignment.types";
import type { ExecutionStatus } from "./metrics.types";

export interface TeacherDashboardData {
  summary: { activeGroups: number; activeStudents: number; activeAssignments: number; needsGrading: number; validationIssues: number };
  validationItems: Array<{ assignmentId: string; groupId: string; groupName: string; title: string; status: AssignmentValidationStatus }>;
  gradingItems: Array<{ assignmentId: string; groupId: string; groupName: string; title: string; submitted: number; needsGrading: number }>;
  upcomingDeadlines: Array<{ assignmentId: string; groupId: string; title: string; launchDate?: string; dueDate?: string; closeDate?: string }>;
  recentSubmissions: Array<{ submissionId: string; assignmentId: string; groupId: string; assignmentTitle: string; studentId: string; studentName: string; language: Language; submittedAt: string; verdict?: ExecutionStatus }>;
}
