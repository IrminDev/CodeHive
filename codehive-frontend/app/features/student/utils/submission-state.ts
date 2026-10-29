import type { Assignment, AssignmentGrade } from "../types/assignment.types";
import type { StudentSubmissionHistory } from "../types/execution.types";
import type { GroupSubmission } from "../types/group-submission.types";

export type Verdict = GroupSubmission["executionStatus"];

/** none: never submitted · evaluating/active: one attempt counts · withdrawn: attempts exist but none counts. */
export type SubmissionPhase = "none" | "evaluating" | "active" | "withdrawn";

export interface SubmissionAttempt {
  /** 1-based, oldest first. Matches the numbering of the submission history page. */
  number: number;
  submissionId: string;
  active: boolean;
  verdict: Verdict;
  submittedAt: string;
  deliveredLate: boolean;
  withdrawnAt?: string;
  language?: string;
  timeMs?: number;
  memoryMb?: number;
  executionId?: string;
  reportAvailable: boolean;
}

export interface SubmissionState {
  phase: SubmissionPhase;
  current: SubmissionAttempt | null;
  /** Attempts that no longer count, newest first. */
  previous: SubmissionAttempt[];
  nextNumber: number;
  grade: AssignmentGrade | null;
  dueDate?: string;
  closeDate?: string;
  pastDue: boolean;
  closed: boolean;
  canWithdraw: boolean;
}

export interface ReplacementEffects {
  /** A submission sent now is flagged late. */
  marksLate: boolean;
  /** The current attempt is on time and its replacement would not be. */
  losesOnTime: boolean;
  /** A returned grade exists and is cleared by the next submission. */
  clearsGrade: boolean;
  replacesAccepted: boolean;
}

export type OperationStep = "withdraw" | "submit" | "evaluate";

/** Progress of a withdraw or replace request, shown step by step in the submission dialog. */
export interface SubmissionOperation {
  kind: "replace" | "withdraw";
  phase: "withdrawing" | "submitting" | "evaluating" | "done" | "failed";
  previous: SubmissionAttempt;
  newNumber: number;
  failedStep?: OperationStep;
  error?: string;
  verdict?: Verdict;
  passedTests?: number;
  totalTests?: number;
}

export function describeSubmission({
  assignment,
  history,
  current,
  grade,
  now = Date.now(),
}: {
  assignment: Pick<Assignment, "dueDate" | "closeDate">;
  history: StudentSubmissionHistory[];
  current: GroupSubmission | null;
  grade: AssignmentGrade | null;
  now?: number;
}): SubmissionState {
  const ordered = [...history].sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
  const attempts: SubmissionAttempt[] = ordered.map((item, index) => ({
    number: ordered.length - index,
    submissionId: item.submissionId,
    active: item.submissionId === current?.submissionId,
    verdict: item.executionStatus,
    submittedAt: item.submittedAt,
    deliveredLate: item.deliveredLate,
    withdrawnAt: item.withdrawnAt,
    language: item.language,
    timeMs: item.timeMs,
    memoryMb: item.memoryMb,
    executionId: item.executionId,
    reportAvailable: item.reportAvailable,
  }));

  let active = attempts.find((attempt) => attempt.active) ?? null;
  if (current && active) {
    // The page polls the current submission, so its verdict is fresher than the loaded history.
    active = { ...active, verdict: current.executionStatus };
  } else if (current) {
    // Just submitted: the history has not been reloaded yet.
    active = {
      number: attempts.length + 1,
      submissionId: current.submissionId,
      active: true,
      verdict: current.executionStatus,
      submittedAt: current.submittedAt,
      deliveredLate: current.deliveredLate,
      reportAvailable: false,
    };
  }

  const previous = attempts.filter((attempt) => !attempt.active);
  const closed = !!assignment.closeDate && Date.parse(assignment.closeDate) <= now;
  const phase: SubmissionPhase = active
    ? active.verdict === "PENDING" ? "evaluating" : "active"
    : previous.length > 0 ? "withdrawn" : "none";

  return {
    phase,
    current: active,
    previous,
    nextNumber: previous.length + (active ? 1 : 0) + 1,
    grade,
    dueDate: assignment.dueDate,
    closeDate: assignment.closeDate,
    pastDue: !!assignment.dueDate && Date.parse(assignment.dueDate) < now,
    closed,
    canWithdraw: phase === "active" && !closed,
  };
}

export function replacementEffects(state: SubmissionState): ReplacementEffects {
  return {
    marksLate: state.pastDue,
    losesOnTime: state.pastDue && !!state.current && !state.current.deliveredLate,
    clearsGrade: state.grade !== null,
    replacesAccepted: state.current?.verdict === "AC",
  };
}
