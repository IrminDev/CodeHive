import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutionStatus, type ExecutionReport } from "~/features/student/types/execution.types";
import type { TeacherSubmissionEvidence } from "../types/student-work.types";
import { TeacherSubmissionReport } from "./TeacherSubmissionReport";

const submissionId = "00000000-0000-0000-0000-000000000001";
const executionId = "00000000-0000-0000-0000-000000000002";

function evidence(status: ExecutionStatus, reportAvailable: boolean): TeacherSubmissionEvidence {
  return {
    submissionId,
    assignmentId: "00000000-0000-0000-0000-000000000003",
    studentId: "00000000-0000-0000-0000-000000000004",
    language: "JAVA",
    submittedAt: "2026-08-22T12:00:00Z",
    deliveredLate: false,
    status: "SUBMITTED",
    execution: {
      id: executionId,
      submissionId,
      executionType: "DEFINITIVE",
      status,
      isOutdated: false,
      createdAt: "2026-08-22T12:00:00Z",
      artifactsExpireAt: "2026-11-20T12:00:00Z",
    },
    reportAvailable,
  };
}

const report: ExecutionReport = {
  executionId,
  overallStatus: ExecutionStatus.WA,
  totalTests: 3,
  passedTests: 2,
  failedTests: 1,
  maxExecutionTimeMs: 48,
  maxMemoryUsedMb: 32,
  testCaseResults: [
    {
      testCaseNumber: 1,
      status: ExecutionStatus.WA,
      executionTimeMs: 48,
      memoryUsedMb: 32,
      feedback: "Output differs",
      actualOutput: "41",
      expectedOutput: "42",
    },
  ],
};

describe("TeacherSubmissionReport", () => {
  it("shows verdict summary, resources, and retained test diagnostics", () => {
    render(<TeacherSubmissionReport evidence={evidence(ExecutionStatus.WA, true)} report={report} loading={false} error={null} />);

    expect(screen.getByText("Submission report")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "tests passed · 67%")).toBeInTheDocument();
    expect(screen.getByText("48 ms")).toBeInTheDocument();
    expect(screen.getByText("32 MB")).toBeInTheDocument();
    expect(screen.getByText("Actual output")).toBeInTheDocument();
    expect(screen.getByText("Expected output")).toBeInTheDocument();
  });

  it("distinguishes pending evaluation from expired artifacts", () => {
    const { rerender } = render(<TeacherSubmissionReport evidence={evidence(ExecutionStatus.PENDING, false)} report={null} loading={false} error={null} />);
    expect(screen.getByText("Evaluation in progress")).toBeInTheDocument();

    rerender(<TeacherSubmissionReport evidence={evidence(ExecutionStatus.AC, false)} report={null} loading={false} error={null} />);
    expect(screen.getByText("Detailed report expired")).toBeInTheDocument();
    expect(screen.getByText(/Persisted verdict: AC/)).toBeInTheDocument();
  });

  it("shows report fetch errors instead of an endless loader", () => {
    render(<TeacherSubmissionReport evidence={evidence(ExecutionStatus.WA, true)} report={null} loading={false} error="Report download failed" />);
    expect(screen.getByText("Could not load submission report")).toBeInTheDocument();
    expect(screen.getByText("Report download failed")).toBeInTheDocument();
  });
});
