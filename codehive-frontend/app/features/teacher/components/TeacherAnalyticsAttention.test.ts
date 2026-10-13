import { describe, expect, it } from "vitest";
import type { AssignmentMetrics, StudentMetrics } from "../types/metrics.types";
import { gradingQueue, hardestAssignments, openDeadlines, relativeDue, studentsToFollowUp } from "./TeacherAnalyticsAttention";

const DAY = 86400000;
const NOW = Date.parse("2026-10-12T12:00:00Z");
const at = (days: number) => new Date(NOW + days * DAY).toISOString();

function assignment(title: string, overrides: Partial<AssignmentMetrics> = {}): AssignmentMetrics {
  return {
    assignmentId: title, title, validationStatus: "READY", maxPoints: 100, activeStudents: 10, submittedCount: 10, submissionRate: 100,
    lateCount: 0, onTimeRate: 100, averageScore: 80, averagePoints: 80, draftGrades: 0, returnedGrades: 10, averageAttempts: 2,
    averageDeliveryMarginHours: 1, verdictDistribution: { AC: 10 }, missingCount: 0, overdue: false, dueDate: at(5), ...overrides,
  };
}

function student(fullName: string, overrides: Partial<StudentMetrics> = {}): StudentMetrics {
  return {
    studentId: fullName, fullName, enrollmentNumber: "1", joinedAt: at(-30), publishedAssignments: 4, submittedCount: 4, completionRate: 100,
    lateCount: 0, averageScore: 80, gradedAssignments: 4, totalAttempts: 4, missingAssignmentIds: [], ...overrides,
  };
}

const titles = (rows: Array<{ title: string } | { item: { title: string } }>) => rows.map((row) => "item" in row ? row.item.title : row.title);

describe("attention insights", () => {
  it("queues ungraded and unreturned work, largest backlog first", () => {
    const queue = gradingQueue([
      assignment("Done"),
      assignment("Small", { returnedGrades: 9, dueDate: at(-20) }),
      assignment("Large", { returnedGrades: 4, dueDate: at(-1) }),
      assignment("Drafts only", { returnedGrades: 7, draftGrades: 3, dueDate: at(-5) }),
    ]);
    expect(titles(queue)).toEqual(["Large", "Small", "Drafts only"]);
    expect(queue.map((row) => row.ungraded)).toEqual([6, 1, 0]);
  });

  it("lists only assignments students can still submit to", () => {
    const deadlines = openDeadlines([
      assignment("Complete"),
      assignment("Soon", { missingCount: 3, dueDate: at(2) }),
      assignment("Late but open", { missingCount: 2, dueDate: at(-3), closeDate: at(4), overdue: true }),
      assignment("Closed", { missingCount: 5, dueDate: at(-9), closeDate: at(-1), overdue: true }),
      assignment("Not ready", { missingCount: 9, validationStatus: "FAILED" }),
    ], NOW);
    expect(titles(deadlines)).toEqual(["Late but open", "Soon"]);
  });

  it("ranks students by missing work, then lowest score", () => {
    const followUp = studentsToFollowUp([
      student("On track"),
      student("Late only", { lateCount: 1 }),
      student("Two missing, strong", { missingAssignmentIds: ["a", "b"], averageScore: 90 }),
      student("Two missing, weak", { missingAssignmentIds: ["a", "b"], averageScore: 40 }),
      student("Two missing, ungraded", { missingAssignmentIds: ["a", "b"], averageScore: null }),
    ]);
    expect(followUp.map((item) => item.fullName)).toEqual(["Two missing, weak", "Two missing, strong", "Two missing, ungraded", "Late only"]);
  });

  it("finds the least accepted assignments and their main failure", () => {
    const hardest = hardestAssignments([
      assignment("All accepted"),
      assignment("No verdicts", { verdictDistribution: {} }),
      assignment("Pending only", { verdictDistribution: { PENDING: 3 } }),
      assignment("Half", { verdictDistribution: { AC: 5, WA: 2, TLE: 3 } }),
      assignment("Hard", { verdictDistribution: { AC: 1, WA: 6, CE: 1, PENDING: 2 } }),
    ]);
    expect(titles(hardest)).toEqual(["Hard", "Half"]);
    expect(hardest[0]).toMatchObject({ accepted: 1, evaluated: 8, rate: 12.5, mainFailure: "WA" });
    expect(hardest[1].mainFailure).toBe("TLE");
  });

  it("phrases due dates relative to now", () => {
    expect(relativeDue(at(0), NOW)).toBe("Due today");
    expect(relativeDue(at(1), NOW)).toBe("Due tomorrow");
    expect(relativeDue(at(3), NOW)).toBe("Due in 3 days");
    expect(relativeDue(at(-3), NOW)).toBe("Due 3 days ago");
    expect(relativeDue(at(-21), NOW)).toBe("Due 3 weeks ago");
  });
});
