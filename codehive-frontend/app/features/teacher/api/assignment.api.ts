import { API_BASE_URL } from "~/core/config/env";
import { getAuthToken } from "~/core/storage/token.storage";

export type ComparatorType = "EXACT_MATCH" | "FLOATING_POINT";
export type Language = "JAVA" | "PYTHON" | "CPP" | "C";

export interface CreateAssignmentMetadata {
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
  dueDate?: string;
  sampleFlags: boolean[];
}

export async function createAssignment(
  metadata: CreateAssignmentMetadata,
  referenceSolution: File,
  testCaseInputs: File[]
): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated. Please sign in again.");

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("referenceSolution", referenceSolution);
  testCaseInputs.forEach((file) => formData.append("testCaseInputs", file));

  const response = await fetch(`${API_BASE_URL}/api/assignments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to create assignment.");
  }
}
