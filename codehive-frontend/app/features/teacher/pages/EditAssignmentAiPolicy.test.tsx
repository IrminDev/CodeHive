import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getTeacherAssignment, getTeacherAssignmentPreview, updateAiPolicy, updateAssignment } from "../api/assignment.api";
import type { TeacherAssignment } from "../types/assignment.types";
import { EditAssignmentPage } from "./EditAssignmentPage";

const notices = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sileo", () => ({ sileo: notices }));
vi.mock("../api/assignment.api", () => ({
  getTeacherAssignment: vi.fn(), getTeacherAssignmentPreview: vi.fn(),
  updateAiPolicy: vi.fn(), updateAssignment: vi.fn(),
}));
vi.mock("../components/TeacherShell", () => ({ TeacherShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("~/shared/components/CodeEditor", () => ({ CodeEditor: () => null }));

const ID = "00000000-0000-0000-0000-000000000001";
const assignment: TeacherAssignment = {
  id: ID, groupId: "00000000-0000-0000-0000-000000000002", authorId: "00000000-0000-0000-0000-000000000003",
  title: "Loops", description: "Practice loop boundaries.", constraints: [], hints: [], tags: [],
  timeLimitMs: 1000, memoryLimitMb: 128, maxPoints: 100, comparatorType: "EXACT_MATCH", allowedLanguages: ["JAVA"],
  isActive: true, validationStatus: "READY", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z",
  aiAssistanceEnabled: true, maxAiRequests: 3, aiAssistanceLevel: "CONCEPTUAL_ONLY", aiPolicyVersion: 1,
  examples: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getTeacherAssignment).mockResolvedValue(assignment);
  vi.mocked(getTeacherAssignmentPreview).mockResolvedValue({
    assignment, referenceLanguage: "JAVA", referenceSolution: "class Main {}", testCases: [],
  });
  vi.mocked(updateAiPolicy).mockImplementation(async (_id, policy) => ({ ...policy, aiPolicyVersion: 2 }));
  vi.mocked(updateAssignment).mockResolvedValue({
    id: "00000000-0000-0000-0000-000000000004", assignmentId: ID, kind: "METADATA", status: "APPLIED",
    createdAt: "2026-10-19T00:00:00Z",
  });
});
afterEach(cleanup);

async function openPage() {
  render(<MemoryRouter initialEntries={[`/teacher/assignments/${ID}/edit`]}><Routes>
    <Route path="/teacher/assignments/:assignmentId/edit" element={<EditAssignmentPage />} />
    <Route path="/teacher/assignments" element={<p>Assignment list</p>} />
  </Routes></MemoryRouter>);
  return screen.findByRole("spinbutton", { name: /Lifetime answers/ });
}

it("main save persists changed quota and assistance level before assignment changes", async () => {
  const quota = await openPage();
  fireEvent.change(quota, { target: { value: "7" } });
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Assistance level" }), { key: "ArrowDown" });
  fireEvent.click(await screen.findByRole("option", { name: "Explanations and guiding" }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await screen.findByText("Assignment list");
  expect(updateAiPolicy).toHaveBeenCalledWith(ID, {
    aiAssistanceEnabled: true, maxAiRequests: 7, aiAssistanceLevel: "EXPLANATIONS_AND_GUIDING",
  });
  expect(vi.mocked(updateAiPolicy).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(updateAssignment).mock.invocationCallOrder[0]);
});

it("policy failure preserves edits and prevents assignment save and navigation", async () => {
  vi.mocked(updateAiPolicy).mockRejectedValue(new Error("Policy could not be saved."));
  const quota = await openPage();
  fireEvent.change(quota, { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => expect(notices.error).toHaveBeenCalledWith({ title: "Policy could not be saved." }));
  expect(updateAssignment).not.toHaveBeenCalled();
  expect(screen.queryByText("Assignment list")).not.toBeInTheDocument();
  expect(quota).toHaveValue(7);
  expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
});

it("keeps AI edits local until the single main save action", async () => {
  const quota = await openPage();
  fireEvent.change(quota, { target: { value: "5" } });
  expect(updateAiPolicy).not.toHaveBeenCalled();
  expect(updateAssignment).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: /Save AI policy/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Unsaved AI changes/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Assignment list");
  expect(updateAiPolicy).toHaveBeenCalledTimes(1);
  expect(updateAssignment).toHaveBeenCalledTimes(1);
});

it("main save disables assistance with a zero quota", async () => {
  await openPage();
  fireEvent.click(screen.getByRole("checkbox", { name: "Enable assistant for this assignment" }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Assignment list");
  expect(updateAiPolicy).toHaveBeenCalledWith(ID, {
    aiAssistanceEnabled: false, maxAiRequests: 0, aiAssistanceLevel: "CONCEPTUAL_ONLY",
  });
});

it("unchanged policy does not cause a write or cancel pending assistant work", async () => {
  await openPage();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Assignment list");
  expect(updateAiPolicy).not.toHaveBeenCalled();
  expect(updateAssignment).toHaveBeenCalledTimes(1);
});

it("retry after assignment failure does not repeat an already successful policy save", async () => {
  vi.mocked(updateAssignment).mockRejectedValueOnce(new Error("Assignment could not be saved."));
  const quota = await openPage();
  fireEvent.change(quota, { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(notices.error).toHaveBeenCalledWith({ title: "Assignment could not be saved." }));
  expect(screen.queryByText("Assignment list")).not.toBeInTheDocument();
  expect(screen.getByText(/AI settings are saved/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Assignment list");
  expect(updateAiPolicy).toHaveBeenCalledTimes(1);
  expect(updateAssignment).toHaveBeenCalledTimes(2);
});
