import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AssignmentGrade } from "../types/assignment.types";
import type { SubmissionAttempt, SubmissionOperation, SubmissionState } from "../utils/submission-state";
import { SubmissionDialog, type SubmissionDialogProps } from "./SubmissionDialog";
import { SubmissionStatusButton } from "./SubmissionStatusButton";

const ATTEMPT: SubmissionAttempt = {
  number: 2, submissionId: "s2", active: true, verdict: "AC", submittedAt: "2026-10-13T18:02:00Z",
  deliveredLate: false, language: "C", timeMs: 34, memoryMb: 23, executionId: "e2", reportAvailable: true,
};
const WITHDRAWN: SubmissionAttempt = {
  number: 1, submissionId: "s1", active: false, verdict: "WA", submittedAt: "2026-10-12T10:00:00Z",
  withdrawnAt: "2026-10-13T17:00:00Z", deliveredLate: false, language: "C", executionId: "e1", reportAvailable: true,
};
const GRADE: AssignmentGrade = {
  id: "g1", assignmentId: "a1", studentId: "u1", submissionId: "s2", value: 90, maxPoints: 100,
  status: "RETURNED", updatedAt: "2026-10-13T19:00:00Z", returnedAt: "2026-10-13T19:00:00Z",
};

afterEach(cleanup);

function state(patch: Partial<SubmissionState> = {}): SubmissionState {
  return {
    phase: "active", current: ATTEMPT, previous: [WITHDRAWN], nextNumber: 3, grade: null,
    dueDate: "2026-10-31T23:59:00Z", closeDate: "2026-11-08T23:59:00Z", pastDue: false, closed: false, canWithdraw: true,
    ...patch,
  };
}

function open(patch: Partial<SubmissionDialogProps> = {}) {
  const handlers = {
    onClose: vi.fn(), onReplace: vi.fn(), onWithdraw: vi.fn(), onRetrySubmit: vi.fn(), onSubmitNew: vi.fn(), onViewResults: vi.fn(),
  };
  render(
    <MemoryRouter>
      <SubmissionDialog
        assignmentId="a1"
        assignmentTitle="Matrix diagonal difference"
        state={state()}
        initialView="overview"
        operation={null}
        editor={{ language: "C", lines: 28, empty: false }}
        canSubmitNew
        submitBlockReason={null}
        {...handlers}
        {...patch}
      />
    </MemoryRouter>,
  );
  return handlers;
}

function operation(patch: Partial<SubmissionOperation>): SubmissionOperation {
  return { kind: "replace", phase: "withdrawing", previous: ATTEMPT, newNumber: 3, ...patch };
}

describe("SubmissionDialog", () => {
  it("states which attempt counts, its result, and its grade", () => {
    open({ state: state({ grade: GRADE }) });
    const current = screen.getByRole("region", { name: "Attempt #2" });
    expect(within(current).getByText("Current")).toBeInTheDocument();
    expect(within(current).getByText("Accepted")).toBeInTheDocument();
    expect(within(current).getByText("On time")).toBeInTheDocument();
    expect(within(current).getByText("90 / 100")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Earlier attempts" })).getByText("Withdrawn")).toBeInTheDocument();
  });

  it("says a grade has not been returned yet", () => {
    open();
    expect(screen.getByText(/Not returned yet/)).toBeInTheDocument();
  });

  it("asks before replacing and lists every consequence that applies", () => {
    const handlers = open({ state: state({ grade: GRADE, pastDue: true, dueDate: "2026-10-13T12:00:00Z" }) });
    fireEvent.click(screen.getByRole("button", { name: "Replace with editor code…" }));
    expect(screen.getByRole("dialog", { name: "Replace attempt #2?" })).toBeInTheDocument();
    expect(screen.getByText(/passed every test/)).toBeInTheDocument();
    expect(screen.getByText(/Attempt #2 is on time; the new attempt will be marked late/)).toBeInTheDocument();
    expect(screen.getByText(/returned grade \(90 \/ 100\) is cleared/)).toBeInTheDocument();
    expect(handlers.onReplace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw and submit" }));
    expect(handlers.onReplace).toHaveBeenCalledTimes(1);
  });

  it("leaves out consequences that do not apply", () => {
    open({ initialView: "replace", state: state({ current: { ...ATTEMPT, verdict: "WA" } }) });
    expect(screen.getByRole("dialog", { name: "Replace attempt #2?" })).toBeInTheDocument();
    expect(screen.queryByText(/marked late/)).not.toBeInTheDocument();
    expect(screen.queryByText(/grade/i)).not.toBeInTheDocument();
    expect(screen.getByText("The new attempt counts whatever its result is.")).toBeInTheDocument();
  });

  it("keeps the current attempt when the student backs out of a resubmit", () => {
    const handlers = open({ initialView: "replace" });
    fireEvent.click(screen.getByRole("button", { name: "Keep attempt #2" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(handlers.onReplace).not.toHaveBeenCalled();
  });

  it("refuses to replace with an empty editor", () => {
    open({ initialView: "replace", editor: { language: "C", lines: 1, empty: true } });
    expect(screen.getByRole("button", { name: "Withdraw and submit" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Your editor is empty");
  });

  it("warns that withdrawing alone delivers nothing", () => {
    const handlers = open();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw without replacing…" }));
    expect(screen.getByRole("dialog", { name: "Withdraw attempt #2?" })).toBeInTheDocument();
    expect(screen.getByText(/nothing is delivered for this assignment/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw attempt #2" }));
    expect(handlers.onWithdraw).toHaveBeenCalledTimes(1);
  });

  it("locks a closed assignment", () => {
    open({ state: state({ closed: true, canWithdraw: false }), initialView: "replace" });
    expect(screen.getByRole("dialog", { name: "Your submission" })).toBeInTheDocument();
    expect(screen.getByText(/is final and can no longer be changed/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Replace with editor code…" })).not.toBeInTheDocument();
  });

  it("flags that nothing counts after a withdrawal and offers to submit", () => {
    const handlers = open({ state: state({ phase: "withdrawn", current: null, previous: [{ ...ATTEMPT, active: false, withdrawnAt: "2026-10-13T19:00:00Z" }, WITHDRAWN], canWithdraw: false }) });
    expect(screen.getByText("No attempt counts right now")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit editor code as attempt #3" }));
    expect(handlers.onSubmitNew).toHaveBeenCalledTimes(1);
  });

  it("cannot be dismissed while a request is in flight", () => {
    const handlers = open({ operation: operation({ phase: "withdrawing" }) });
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Withdrawing attempt #2…");
  });

  it("confirms the replacement with the new result", () => {
    const handlers = open({ operation: operation({ phase: "done", verdict: "WA", passedTests: 3, totalTests: 10 }) });
    expect(screen.getByRole("dialog", { name: "Submission replaced" })).toBeInTheDocument();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Attempt #3 now counts as your submission");
    expect(status).toHaveTextContent("Wrong answer");
    expect(status).toHaveTextContent("3 of 10 tests passed");
    expect(status).toHaveTextContent("Attempt #2 (Accepted) is withdrawn and cannot be restored");
    fireEvent.click(screen.getByRole("button", { name: "View results" }));
    expect(handlers.onViewResults).toHaveBeenCalledTimes(1);
  });

  it("explains a failure after the withdrawal went through", () => {
    const handlers = open({ state: state({ phase: "withdrawn", current: null, canWithdraw: false }), operation: operation({ phase: "failed", failedStep: "submit", error: "Network error" }) });
    expect(screen.getByRole("status")).toHaveTextContent("No attempt counts right now");
    expect(screen.getByRole("status")).toHaveTextContent("Attempt #2 was withdrawn, but attempt #3 was not sent");
    fireEvent.click(screen.getByRole("button", { name: "Submit again" }));
    expect(handlers.onRetrySubmit).toHaveBeenCalledTimes(1);
  });

  it("explains that nothing changed when the withdrawal itself fails", () => {
    const handlers = open({ operation: operation({ phase: "failed", failedStep: "withdraw", error: "Server error" }) });
    expect(screen.getByRole("status")).toHaveTextContent("Nothing changed");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(handlers.onReplace).toHaveBeenCalledTimes(1);
  });
});

describe("SubmissionStatusButton", () => {
  it("describes each state in words", () => {
    const { rerender } = render(<SubmissionStatusButton state={state()} onOpen={() => undefined} />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Submission: attempt #2 counts, Accepted. Open details");
    rerender(<SubmissionStatusButton state={state({ phase: "withdrawn", current: null, previous: [{ ...ATTEMPT, active: false }] })} onOpen={() => undefined} />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Submission: attempt #2 was withdrawn, nothing counts as delivered. Open details");
    rerender(<SubmissionStatusButton state={state({ phase: "none", current: null, previous: [] })} onOpen={() => undefined} />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Submission: nothing submitted yet. Open details");
  });
});
