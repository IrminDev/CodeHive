import { API_BASE_URL } from "~/core/config/env";
import { teacherAuthHeaders, teacherRequest } from "./client";
import type {
  AssignmentPage,
  AssignmentPreview,
  AssignmentUpdate,
  CloneAssignmentForm,
  CloneAssignmentPayload,
  CreateAssignmentMetadata,
  TeacherAssignment,
  UpdateAssignmentMetadata,
} from "../types/assignment.types";
import type { TeacherGroup } from "../types/group.types";

export type {
  AssignmentExample,
  AssignmentPage,
  AssignmentPreview,
  AssignmentPreviewTestCase,
  AssignmentUpdate,
  CloneAssignmentForm,
  CloneAssignmentPayload,
  ComparatorType,
  CreateAssignmentMetadata,
  Language,
  TeacherAssignment,
  UpdateAssignmentMetadata,
} from "../types/assignment.types";
export type { TeacherGroup } from "../types/group.types";

function multipartMetadata(metadata: unknown): FormData {
  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  return formData;
}

function normalizeAssignment(assignment: TeacherAssignment): TeacherAssignment {
  return {
    ...assignment,
    constraints: assignment.constraints ?? [],
    hints: assignment.hints ?? [],
    tags: assignment.tags ?? [],
    allowedLanguages: assignment.allowedLanguages ?? [],
    examples: assignment.examples ?? [],
    sampleTestCases: assignment.sampleTestCases ?? [],
  };
}

async function multipartRequest<T>(path: string, method: "POST" | "PATCH", formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: teacherAuthHeaders(),
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = body as { message?: string; error?: string; errors?: string[] };
    throw new Error(error.message || error.error || error.errors?.join(", ") || `HTTP ${response.status}`);
  }
  return (body as { data: T }).data;
}

export function createAssignment(
  metadata: CreateAssignmentMetadata,
  referenceSolution: File,
  testCaseInputs: File[],
): Promise<TeacherAssignment> {
  const formData = multipartMetadata(metadata);
  formData.append("referenceSolution", referenceSolution);
  testCaseInputs.forEach((file) => formData.append("testCaseInputs", file));
  return multipartRequest<TeacherAssignment>("/api/assignments", "POST", formData);
}

export function updateAssignment(
  assignmentId: string,
  metadata: UpdateAssignmentMetadata,
  referenceSolution?: File,
  testCaseInputs: File[] = [],
): Promise<AssignmentUpdate> {
  const formData = multipartMetadata(metadata);
  if (referenceSolution) formData.append("referenceSolution", referenceSolution);
  testCaseInputs.forEach((file) => formData.append("testCaseInputs", file));
  return multipartRequest<AssignmentUpdate>(
    `/api/assignments/${encodeURIComponent(assignmentId)}`,
    "PATCH",
    formData,
  );
}

export function getAssignmentUpdate(updateId: string): Promise<AssignmentUpdate> {
  return teacherRequest<AssignmentUpdate>(
    `/api/assignments/updates/${encodeURIComponent(updateId)}`,
  );
}

export function getTeacherAssignment(assignmentId: string): Promise<TeacherAssignment> {
  return teacherRequest<TeacherAssignment>(
    `/api/assignments/${encodeURIComponent(assignmentId)}`,
  ).then(normalizeAssignment);
}

export function getTeacherAssignmentPreview(assignmentId: string): Promise<AssignmentPreview> {
  return teacherRequest<AssignmentPreview>(
    `/api/assignments/${encodeURIComponent(assignmentId)}/preview`,
  ).then((preview) => ({
    ...preview,
    assignment: normalizeAssignment(preview.assignment),
    testCases: preview.testCases ?? [],
  }));
}

export function getTeacherAssignmentPage(
  groupId: string,
  page = 0,
  size = 100,
): Promise<AssignmentPage> {
  const params = new URLSearchParams({ groupId, page: String(page), size: String(size) });
  return teacherRequest<AssignmentPage>(`/api/assignments?${params}`).then((result) => ({
    ...result,
    content: result.content.map(normalizeAssignment),
  }));
}

export async function getTeacherAssignments(groupId: string): Promise<TeacherAssignment[]> {
  return (await getTeacherAssignmentPage(groupId)).content;
}

export async function getActiveTeacherGroups(): Promise<TeacherGroup[]> {
  const groups = await teacherRequest<TeacherGroup[]>("/api/groups");
  return groups.filter((group) => group.isActive && !group.archived);
}

export function getCloneAssignmentForm(assignmentId: string): Promise<CloneAssignmentForm> {
  return teacherRequest<CloneAssignmentForm>(
    `/api/assignments/${encodeURIComponent(assignmentId)}/clone-form`,
  ).then((form) => ({
    ...form,
    constraints: form.constraints ?? [],
    hints: form.hints ?? [],
    tags: form.tags ?? [],
    allowedLanguages: form.allowedLanguages ?? [],
    examples: form.examples ?? [],
    testCases: form.testCases ?? [],
  }));
}

export function cloneAssignment(
  assignmentId: string,
  payload: CloneAssignmentPayload,
): Promise<TeacherAssignment> {
  return teacherRequest<TeacherAssignment>(
    `/api/assignments/${encodeURIComponent(assignmentId)}/clone`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAssignment(assignmentId: string): Promise<void> {
  return teacherRequest<void>(`/api/assignments/${encodeURIComponent(assignmentId)}`, {
    method: "DELETE",
  });
}
