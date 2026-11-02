import type { Language } from "./assignment.types";

export type AssistantStatus = "PENDING" | "COMPLETED" | "REDIRECTED" | "BLOCKED" | "FAILED" | "CANCELLED";
export type AiAssistanceLevel = "CONCEPTUAL_ONLY" | "EXPLANATIONS_AND_GUIDING" | "EXPLANATIONS_GUIDING_AND_SNIPPETS";

export interface AssistantAvailability {
  available: boolean;
  reason: string | null;
  maximum: number;
  used: number;
  reserved: number;
  remaining: number;
  assistanceLevel: AiAssistanceLevel | null;
  policyVersion: number;
  pendingInteractionId: string | null;
}

export interface AssistantInteraction {
  id: string;
  sequence: number;
  status: AssistantStatus;
  studentMessage: string | null;
  assistantResponse: string | null;
  contentErased: boolean;
  quotaCharged: boolean;
  failureCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AssistantMessageRequest {
  clientRequestId: string;
  message: string;
  language: Language;
  includeEditorCode: boolean;
  includeExecutionContext: boolean;
  editorCode?: string;
}

export interface AssistantMessageResult {
  interaction: AssistantInteraction;
  availability: AssistantAvailability;
  editorIncluded: boolean;
  executionRequested: boolean;
  executionIncluded: boolean;
  executionUnavailable: boolean;
  historyTruncated: boolean;
}

export interface AssistantHistoryPage {
  content: AssistantInteraction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
