import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { StudentExplorer } from "./TeacherAnalyticsExplorer";
import { TeacherStudentAnalyticsDrawer } from "./TeacherStudentAnalyticsDrawer";
import type { StudentMetrics, StudentAssignmentAnalytics } from "../types/metrics.types";
import type { Breakdown, Summary } from "~/features/assistant-usage/types";

vi.mock("~/core/providers/AuthProvider", () => ({ useAuth: () => ({ user: { id: "teacher-1" } }) }));
vi.mock("../api/metrics.api", () => ({ listStudentAssignmentMetrics: vi.fn() }));
vi.mock("~/features/assistant-usage/api", async original => ({ ...await original<typeof import("~/features/assistant-usage/api")>(), usageRequest: vi.fn() }));
import { listStudentAssignmentMetrics } from "../api/metrics.api";
import { usageRequest } from "~/features/assistant-usage/api";

const student: StudentMetrics = { studentId: "student-1", fullName: "Grace Hopper", enrollmentNumber: "ST001", joinedAt: "2026-01-01", publishedAssignments: 2, submittedCount: 1, completionRate: 50, lateCount: 1, averageScore: 80, gradedAssignments: 1, totalAttempts: 4, missingAssignmentIds: ["assignment-2"] };
const grade: StudentAssignmentAnalytics = { assignmentId: "assignment-1", title: "Loops", maxPoints: 10, workStatus: "SUBMITTED", attempts: 2, verdict: "AC", grade: { value: 8, maxPoints: 10, status: "DRAFT" } };

function mockData() {
  vi.mocked(listStudentAssignmentMetrics).mockResolvedValue([grade, { ...grade, assignmentId: "assignment-2", title: "Arrays", workStatus: "NOT_SUBMITTED", verdict: null, grade: null }]);
  vi.mocked(usageRequest).mockImplementation(async (_audience, path) => (path.includes("/assignments?") ? { rows: { last: true, content: [{ id: "assignment-1", responses: 3, quota: { usedLifetime: 12 } }, { id: "assignment-2", responses: 0, quota: { usedLifetime: 0 } }] } } as Breakdown : { educational: { requests: 8, responses: 3, blocked: 2, failed: 1, cancelled: 0, pending: 2 } } as Summary) as never);
}
function drawer() {
  return <MemoryRouter><TeacherStudentAnalyticsDrawer student={student} groupId="group-1" assignmentTitles={new Map([["assignment-2", "Arrays"]])} refreshVersion={0} onClose={() => {}} /></MemoryRouter>;
}
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("student analytics details", () => {
  it("uses one details button per student without missing-work messages or grade links", () => {
    const onOpen = vi.fn();
    render(<StudentExplorer students={[student, { ...student, studentId: "student-2", fullName: "Ada Lovelace", missingAssignmentIds: [], lateCount: 0 }]} onOpen={onOpen} query="" filter="all" sort="risk" onQuery={() => {}} onFilter={() => {}} onSort={() => {}} onRetry={() => {}} />);
    const details = screen.getByRole("button", { name: "View details for Grace Hopper" });
    expect(within(details).queryByRole("button")).toBeNull();
    expect(screen.queryByText(/missing assignments/i)).toBeNull();
    expect(screen.queryByText("1 missing")).toBeNull();
    expect(screen.queryByText("Review grades")).toBeNull();
    expect(screen.queryByText("View analytics")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getAllByText("View details")).toHaveLength(2);
    fireEvent.click(details);
    expect(onOpen).toHaveBeenCalledWith("student-1");
  });

  it("keeps missing assignments, grades, evidence and lifetime AI counts available in drawer tabs", async () => {
    mockData();
    render(drawer());
    const missing = screen.getByRole("heading", { name: "Missing assignments" }).closest("section")!;
    expect(missing).toHaveTextContent("Arrays");
    expect(within(missing).getByText("missing")).toBeTruthy();
    expect(screen.getByText("Completion").parentElement).toHaveTextContent("50.00%");
    fireEvent.click(screen.getByRole("tab", { name: "Grades" }));
    const loops = (await screen.findByRole("heading", { name: "Loops" })).closest("article")!;
    await waitFor(() => expect(within(loops).getByText("AI answers used (lifetime)").parentElement).toHaveTextContent("12"));
    expect(loops).toHaveTextContent("8 / 10");
    expect(loops).toHaveTextContent("Draft");
    expect(loops).toHaveTextContent("AC");
    expect(within(loops).getByRole("link", { name: "Review work for Loops" })).toHaveAttribute("href", "/teacher/grades?groupId=group-1&assignmentId=assignment-1&studentId=student-1");
    const arrays = screen.getByRole("heading", { name: "Arrays" }).closest("article")!;
    expect(arrays).toHaveTextContent("Not graded");
    expect(within(arrays).getByText("AI answers used (lifetime)").parentElement).toHaveTextContent("0");
    fireEvent.click(screen.getByRole("tab", { name: "AI Usage" }));
    expect(screen.getByText("Answers used").parentElement).toHaveTextContent("3");
    expect(screen.getByText("Without an answer").parentElement).toHaveTextContent("3");
    expect(screen.getByText("In progress").parentElement).toHaveTextContent("2");
    expect(screen.getByText(/last 30 days/)).toBeTruthy();
  });

  it("preserves grades when AI fails and restores usage through retry", async () => {
    mockData();
    vi.mocked(usageRequest).mockRejectedValue(new Error("Usage unavailable"));
    render(drawer());
    fireEvent.click(screen.getByRole("tab", { name: "Grades" }));
    await screen.findByRole("button", { name: "Retry AI usage" });
    const loops = screen.getByRole("heading", { name: "Loops" }).closest("article")!;
    expect(loops).toHaveTextContent("8 / 10");
    expect(within(loops).getByText("AI answers used (lifetime)").parentElement).toHaveTextContent("Unavailable");
    mockData();
    fireEvent.click(screen.getByRole("button", { name: "Retry AI usage" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Loops" }).closest("article")).toHaveTextContent("12"));
  });
});
