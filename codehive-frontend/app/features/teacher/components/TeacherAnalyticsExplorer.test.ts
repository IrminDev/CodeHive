import { describe, expect, it } from "vitest";
import type { AssignmentMetrics } from "../types/metrics.types";
import { PRIORITY_SORT, sortAssignments } from "./TeacherAnalyticsExplorer";

function assignment(title: string, overrides: Partial<AssignmentMetrics> = {}): AssignmentMetrics {
  return {
    assignmentId: title, title, validationStatus: "READY", maxPoints: 100, activeStudents: 10, submittedCount: 10, submissionRate: 100,
    lateCount: 0, onTimeRate: 100, averageScore: 80, averagePoints: 80, draftGrades: 0, returnedGrades: 10, averageAttempts: 1,
    averageDeliveryMarginHours: 1, verdictDistribution: { AC: 10 }, missingCount: 0, overdue: false, ...overrides,
  };
}

describe("sortAssignments", () => {
  const settled = assignment("Settled");
  const overdue = assignment("Overdue", { overdue: true, missingCount: 4, submittedCount: 6 });
  const ungraded = assignment("Ungraded", { returnedGrades: 4 });
  const noGrades = assignment("No grades", { averageScore: null, returnedGrades: 10 });

  it("lists what needs attention first by default", () => {
    expect(sortAssignments([settled, ungraded, overdue], PRIORITY_SORT).map((item) => item.title)).toEqual(["Overdue", "Ungraded", "Settled"]);
  });
  it("keeps rows without data last in both directions", () => {
    const low = assignment("Low", { averageScore: 40 });
    expect(sortAssignments([noGrades, settled, low], { key: "score", descending: true }).map((item) => item.title)).toEqual(["Settled", "Low", "No grades"]);
    expect(sortAssignments([noGrades, settled, low], { key: "score", descending: false }).map((item) => item.title)).toEqual(["Low", "Settled", "No grades"]);
  });
  it("sorts by title without mutating the input", () => {
    const input = [settled, overdue];
    expect(sortAssignments(input, { key: "title", descending: false }).map((item) => item.title)).toEqual(["Overdue", "Settled"]);
    expect(input[0]).toBe(settled);
  });
});
