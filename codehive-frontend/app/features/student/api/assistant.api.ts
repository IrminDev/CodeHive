import { ApiError, jsonBody, studentRequest } from "./client";
import type { AssistantAvailability, AssistantHistoryPage, AssistantInteraction, AssistantMessageRequest, AssistantMessageResult } from "../types/assistant.types";

const base = (assignmentId: string) => `/api/assignments/${encodeURIComponent(assignmentId)}/assistant`;

export const getAssistantAvailability = (assignmentId: string) =>
  studentRequest<AssistantAvailability>(base(assignmentId));

export async function listAssistantHistory(assignmentId: string, page = 0): Promise<AssistantHistoryPage> {
  try {
    return await studentRequest<AssistantHistoryPage>(`${base(assignmentId)}/interactions?page=${page}&size=20`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { content: [], page, size: 20, totalElements: 0, totalPages: 0, last: true };
    }
    throw error;
  }
}

export const getAssistantInteraction = (assignmentId: string, interactionId: string) =>
  studentRequest<AssistantInteraction>(`${base(assignmentId)}/interactions/${encodeURIComponent(interactionId)}`);

export const sendAssistantMessage = (assignmentId: string, request: AssistantMessageRequest) =>
  studentRequest<AssistantMessageResult>(`${base(assignmentId)}/interactions`, {
    method: "POST", ...jsonBody(request),
  });
