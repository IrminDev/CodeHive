import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";

export type ComparatorType = "EXACT_MATCH" | "FLOATING_POINT";
export type Language = "JAVA" | "PYTHON" | "CPP" | "C";

export interface AssignmentExample {
  input: string;
  output: string;
  explanation: string;
}

export interface CreateAssignmentMetadata {
  groupId: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  comparatorType: ComparatorType;
  allowedLanguages: Language[];
  referenceLanguage: Language;
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
  examples: AssignmentExample[];
  maxPoints: number;
  sampleFlags: boolean[];
}

export interface TeacherGroup {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  isActive: boolean;
}

export interface TeacherAssignment {
  id: string;
  groupId: string;
  title: string;
  description: string;
  allowedLanguages: Language[];
  validationStatus: "PROCESSING" | "READY" | "FAILED";
  dueDate?: string;
}

export interface CloneAssignmentForm {
  sourceGroupId: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  comparatorType: ComparatorType;
  allowedLanguages: Language[];
  referenceLanguage: Language;
  referenceSolution: string;
  examples: AssignmentExample[];
  testCases: Array<{ order: number; input: string; sample: boolean }>;
  maxPoints: number;
}

export interface CloneAssignmentPayload {
  targetGroupId: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  comparatorType: ComparatorType;
  allowedLanguages: Language[];
  referenceLanguage: Language;
  referenceSolution: string;
  testCases: Array<{ input: string; sample: boolean }>;
  examples: AssignmentExample[];
  maxPoints: number;
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface AssignmentPage {
  content: TeacherAssignment[];
  totalPages: number;
  totalElements: number;
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated. Please sign in again.");
  return { Authorization: `Bearer ${token}` };
}

async function readError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  return new Error((body as { message?: string }).message || fallback);
}

export async function createAssignment(
  metadata: CreateAssignmentMetadata,
  referenceSolution: File,
  testCaseInputs: File[]
): Promise<void> {
  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("referenceSolution", referenceSolution);
  testCaseInputs.forEach((file) => formData.append("testCaseInputs", file));

  const response = await fetch(`${API_BASE_URL}/api/assignments`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) throw await readError(response, "Failed to create assignment.");
}

export async function getActiveTeacherGroups(): Promise<TeacherGroup[]> {
  const response = await fetch(`${API_BASE_URL}/api/groups`, { headers: authHeaders() });
  if (!response.ok) throw await readError(response, "Failed to load groups.");
  const body = (await response.json()) as ApiResponse<TeacherGroup[]>;
  return body.data.filter((group) => group.isActive && !group.archived);
}

export async function getCloneAssignmentForm(assignmentId: string): Promise<CloneAssignmentForm> {
  const response = await fetch(
    `${API_BASE_URL}/api/assignments/${encodeURIComponent(assignmentId)}/clone-form`,
    { headers: authHeaders() }
  );
  if (!response.ok) throw await readError(response, "Failed to load assignment clone form.");
  return ((await response.json()) as ApiResponse<CloneAssignmentForm>).data;
}

export async function cloneAssignment(
  assignmentId: string,
  payload: CloneAssignmentPayload
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/assignments/${encodeURIComponent(assignmentId)}/clone`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) throw await readError(response, "Failed to clone assignment.");
}

export async function getTeacherAssignments(groupId: string): Promise<TeacherAssignment[]> {
  const params = new URLSearchParams({ groupId, page: "0", size: "100" });
  const response = await fetch(`${API_BASE_URL}/api/assignments?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw await readError(response, "Failed to load assignments.");
  return ((await response.json()) as ApiResponse<AssignmentPage>).data.content;
}
