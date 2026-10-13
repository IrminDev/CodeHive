import { describe, expect, it } from "vitest";
import { ExecutionStatus, Language, type StudentSubmissionHistory } from "../types/execution.types";
import type { AssignmentGrade } from "../types/assignment.types";
import type { GroupSubmission } from "../types/group-submission.types";
import { describeSubmission, replacementEffects } from "./submission-state";

const NOW = Date.parse("2026-10-13T18:00:00Z");
const OPEN = { dueDate: "2026-10-31T23:59:00Z", closeDate: "2026-11-08T23:59:00Z" };

function attempt(id: string, submittedAt: string, patch: Partial<StudentSubmissionHistory> = {}): StudentSubmissionHistory {
  return {
    submissionId: id,
    assignmentId: "a1",
    language: Language.C,
    submissionStatus: "SUBMITTED",
    submittedAt,
    deliveredLate: false,
    executionStatus: ExecutionStatus.AC,
    reportAvailable: true,
    ...patch,
  };
}

function current(id: string, executionStatus: GroupSubmission["executionStatus"] = "AC"): GroupSubmission {
  return { assignmentId: "a1", submissionId: id, submittedAt: "2026-10-13T17:00:00Z", deliveredLate: false, executionStatus };
}

const GRADE: AssignmentGrade = {
  id: "g1", assignmentId: "a1", studentId: "u1", submissionId: "s2", value: 90, maxPoints: 100,
  status: "RETURNED", updatedAt: "2026-10-13T17:30:00Z", returnedAt: "2026-10-13T17:30:00Z",
};

describe("describeSubmission", () => {
  it("reports nothing submitted", () => {
    const state = describeSubmission({ assignment: OPEN, history: [], current: null, grade: null, now: NOW });
    expect(state).toMatchObject({ phase: "none", current: null, previous: [], nextNumber: 1, canWithdraw: false });
  });

  it("numbers attempts oldest first and marks the one that counts", () => {
    const history = [
      attempt("s2", "2026-10-13T17:00:00Z"),
      attempt("s1", "2026-10-12T10:00:00Z", { submissionStatus: "WITHDRAWN", withdrawnAt: "2026-10-13T16:00:00Z", executionStatus: ExecutionStatus.WA }),
    ];
    const state = describeSubmission({ assignment: OPEN, history, current: current("s2"), grade: null, now: NOW });
    expect(state.phase).toBe("active");
    expect(state.current).toMatchObject({ number: 2, submissionId: "s2", active: true, verdict: "AC" });
    expect(state.previous).toMatchObject([{ number: 1, active: false, verdict: "WA", withdrawnAt: "2026-10-13T16:00:00Z" }]);
    expect(state.nextNumber).toBe(3);
    expect(state.canWithdraw).toBe(true);
  });

  it("does not depend on the order the history arrives in", () => {
    const history = [attempt("s1", "2026-10-12T10:00:00Z"), attempt("s2", "2026-10-13T17:00:00Z")];
    const state = describeSubmission({ assignment: OPEN, history, current: current("s2"), grade: null, now: NOW });
    expect(state.current?.number).toBe(2);
  });

  it("treats attempts as withdrawn when none of them counts", () => {
    const history = [attempt("s1", "2026-10-12T10:00:00Z", { submissionStatus: "WITHDRAWN", withdrawnAt: "2026-10-13T16:00:00Z" })];
    const state = describeSubmission({ assignment: OPEN, history, current: null, grade: null, now: NOW });
    expect(state).toMatchObject({ phase: "withdrawn", current: null, nextNumber: 2, canWithdraw: false });
    expect(state.previous[0].number).toBe(1);
  });

  it("keeps a submission that is still being evaluated out of reach", () => {
    const history = [attempt("s1", "2026-10-13T17:00:00Z", { executionStatus: ExecutionStatus.AC })];
    const state = describeSubmission({ assignment: OPEN, history, current: current("s1", "PENDING"), grade: null, now: NOW });
    // The polled verdict wins over the loaded history.
    expect(state.current?.verdict).toBe("PENDING");
    expect(state).toMatchObject({ phase: "evaluating", canWithdraw: false });
  });

  it("shows a submission sent before the history reloads as the next attempt", () => {
    const history = [attempt("s1", "2026-10-12T10:00:00Z", { submissionStatus: "WITHDRAWN" })];
    const state = describeSubmission({ assignment: OPEN, history, current: current("s2", "PENDING"), grade: null, now: NOW });
    expect(state.current).toMatchObject({ number: 2, submissionId: "s2", reportAvailable: false });
    expect(state.nextNumber).toBe(3);
  });

  it("locks the submission once the assignment closes", () => {
    const closed = { dueDate: "2026-10-01T00:00:00Z", closeDate: "2026-10-10T00:00:00Z" };
    const state = describeSubmission({ assignment: closed, history: [attempt("s1", "2026-10-05T10:00:00Z")], current: current("s1"), grade: null, now: NOW });
    expect(state).toMatchObject({ phase: "active", closed: true, pastDue: true, canWithdraw: false });
  });
});

describe("replacementEffects", () => {
  it("has no side effects for an ungraded, failing attempt before the due date", () => {
    const state = describeSubmission({ assignment: OPEN, history: [attempt("s1", "2026-10-13T17:00:00Z")], current: current("s1", "WA"), grade: null, now: NOW });
    expect(replacementEffects(state)).toEqual({ marksLate: false, losesOnTime: false, clearsGrade: false, replacesAccepted: false });
  });

  it("warns about lateness, the grade, and an accepted result", () => {
    const afterDue = { dueDate: "2026-10-13T12:00:00Z", closeDate: "2026-11-08T23:59:00Z" };
    const state = describeSubmission({ assignment: afterDue, history: [attempt("s2", "2026-10-13T11:00:00Z")], current: current("s2"), grade: GRADE, now: NOW });
    expect(replacementEffects(state)).toEqual({ marksLate: true, losesOnTime: true, clearsGrade: true, replacesAccepted: true });
  });

  it("does not claim an on-time delivery is lost when the current attempt is already late", () => {
    const afterDue = { dueDate: "2026-10-13T12:00:00Z" };
    const late = { ...current("s1", "WA"), deliveredLate: true };
    const state = describeSubmission({ assignment: afterDue, history: [attempt("s1", "2026-10-13T13:00:00Z", { deliveredLate: true })], current: late, grade: null, now: NOW });
    expect(replacementEffects(state)).toMatchObject({ marksLate: true, losesOnTime: false });
  });
});
