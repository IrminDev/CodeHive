import type { Role, Scope } from "~/shared/types/model/User";

export type AdminUserStatus = "ACTIVE" | "BLOCKED" | "DELETED";
export type AdminAuditOutcome = "SUCCESS" | "FAILURE";
export type AdminAuditAction =
  | "USER_CREATED"
  | "USER_PROFILE_UPDATED"
  | "USER_ROLE_CHANGED"
  | "USER_BLOCKED"
  | "USER_UNBLOCKED"
  | "USER_DELETED"
  | "USER_SCOPES_CHANGED"
  | "CSV_REGISTRATION_SUBMITTED"
  | "CSV_REGISTRATION_COMPLETED";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  lastName: string;
  enrollmentNumber: string;
  role: Role;
  scopes: Scope[];
  status: AdminUserStatus;
  createdAt: string;
  blockedAt: string | null;
}

export interface AdminResourceCounts {
  ownedGroups: number;
  activeOwnedGroups: number;
  archivedOwnedGroups: number;
  enrollments: number;
  activeEnrollments: number;
  authoredAssignments: number;
  activeAuthoredAssignments: number;
  participatedAssignments: number;
  submissions: number;
  executions: number;
}

export interface AdminUserDetail {
  user: AdminUserSummary;
  resources: AdminResourceCounts;
  lifetimeRateLimitViolations: number;
  lastRateLimitViolationAt: string | null;
}

export interface AdminGroupResource {
  id: string;
  name: string;
  relationship: "OWNED" | "ENROLLED";
  active: boolean;
  archived: boolean;
  createdAt: string;
  deletionReason: "OWNER_REQUEST" | "SCOPE_REVOKED" | "ROLE_CHANGED_TO_ADMIN" | "ACCOUNT_DELETED" | null;
  enrollmentStatus: "ACTIVE" | "LEFT" | "REMOVED" | "CANCELLED" | null;
  joinedAt: string | null;
  endedAt: string | null;
}

export interface AdminAssignmentResource {
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  relationship: "AUTHORED" | "PARTICIPATED";
  active: boolean;
  validationStatus: "PROCESSING" | "READY" | "FAILED";
  launchDate: string | null;
  dueDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string;
  studentWorkStatus: "NOT_SUBMITTED" | "SUBMITTED" | "WITHDRAWN" | "RETURNED" | null;
}

export type ExecutionStatus = "TLE" | "MLE" | "OLE" | "RTE" | "CE" | "WA" | "AC" | "PENDING";

export interface AdminSubmissionResource {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  groupId: string;
  groupName: string;
  language: "C" | "CPP" | "JAVA" | "PYTHON";
  status: "SUBMITTED" | "WITHDRAWN" | "SUPERSEDED";
  deliveredLate: boolean;
  createdAt: string;
  withdrawnAt: string | null;
  latestVerdict: ExecutionStatus | null;
}

export interface AdminExecutionResource {
  id: string;
  assignmentId: string | null;
  submissionId: string | null;
  type: "PRACTICE" | "DEFINITIVE";
  trigger: "PRACTICE" | "INITIAL_SUBMISSION" | "ASSIGNMENT_UPDATE" | "MANUAL_RETRY";
  status: ExecutionStatus;
  timeMs: number | null;
  memoryMb: number | null;
  createdAt: string;
  reportAvailable: boolean;
}

export interface AdminStatistics {
  generatedAt: string;
  from: string;
  to: string;
  users: { total: number; active: number; blocked: number; students: number; teachers: number; admins: number; registeredInPeriod: number };
  resources: { activeGroups: number; archivedGroups: number; activeAssignments: number; submissionsInPeriod: number; executionsInPeriod: number };
  assignmentValidation: Record<string, number>;
  executionVerdicts: Record<string, number>;
  incidents: number;
}

export interface RateLimitIncident {
  id: string;
  userId: string;
  userDisplayName: string;
  policy: string;
  method: string;
  endpoint: string;
  occurredAt: string;
  correlationId: string | null;
}

export interface AdminAuditEvent {
  id: string;
  actorId: string | null;
  actorDisplayName: string | null;
  targetId: string | null;
  targetDisplayName: string | null;
  action: AdminAuditAction;
  outcome: AdminAuditOutcome;
  reason: string;
  details: string | null;
  occurredAt: string;
  correlationId: string | null;
}

export interface UpdateUserRequest { name: string; lastName: string; enrollmentNumber: string; email: string; reason: string }
export interface UpdateUserRoleRequest { role: Role; enrollmentNumber: string; reason: string; confirmEnrollmentCancellation: boolean; confirmOwnedGroupDeletion: boolean }
export interface UpdateUserStatusRequest { status: AdminUserStatus; reason: string }
export interface UpdateScopesRequest { grant: Scope[]; revoke: Scope[]; reason: string; confirmOwnedGroupDeletion: boolean }

export interface CsvTaskResponse { taskId: string }
export interface WebSocketTicketResponse { ticket: string; expiresInSeconds: number }
export interface CsvProgressMessage {
  taskId: string;
  status: "PROCESSING" | "ROW_SUCCESS" | "ROW_ERROR" | "COMPLETED";
  currentRow: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  message: string | null;
}
