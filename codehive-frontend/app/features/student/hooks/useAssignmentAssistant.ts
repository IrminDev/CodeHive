import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { getAssistantAvailability, getAssistantInteraction, listAssistantHistory, sendAssistantMessage } from "../api/assistant.api";
import type { Language } from "../types/assignment.types";
import type { AssistantAvailability, AssistantInteraction, AssistantMessageRequest, AssistantMessageResult } from "../types/assistant.types";

function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Connection interrupted. Refresh history to check whether your request completed.";
  switch (error.code) {
    case "GLOBAL_DISABLED": return "AI assistance is not available yet.";
    case "ASSISTANT_DISABLED": return "AI assistance is disabled for this assignment.";
    case "ASSISTANCE_UNAVAILABLE": return "New assistance is unavailable for this assignment or enrollment.";
    case "QUOTA_EXHAUSTED": return "No AI answers remain for this assignment.";
    case "REQUEST_PENDING": return "An answer is already being checked. Refresh history to recover it.";
    case "POLICY_CHANGED": case "REQUEST_CANCELLED": return "Request cancelled because assignment policy or access changed. No answer was charged.";
    case "OUTPUT_REJECTED": return "Answer did not pass educational checks. No answer was charged.";
    case "MODEL_TIMEOUT": return "Assistant timed out. No answer was charged.";
    case "MODEL_UNAVAILABLE": case "MODEL_FAILURE": case "MODEL_BUSY": case "MODEL_RATE_LIMITED": return "Assistant is temporarily unavailable. No answer was charged.";
    default: return error.status === 429
      ? `Too many requests. ${error.retryAfter ? `Retry after ${error.retryAfter} seconds.` : "Try again later."}`
      : error.message;
  }
}

export function useAssignmentAssistant(assignmentId: string) {
  const [availability, setAvailability] = useState<AssistantAvailability | null>(null);
  const [interactions, setInteractions] = useState<AssistantInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AssistantMessageResult | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [revealInteractionId, setRevealInteractionId] = useState<string | null>(null);
  const pendingRequest = useRef<AssistantMessageRequest | null>(null);
  const sendingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [state, page] = await Promise.all([
        getAssistantAvailability(assignmentId), listAssistantHistory(assignmentId),
      ]);
      setAvailability(state);
      setInteractions(page.content.slice().reverse());
      setNextPage(page.last ? null : 1);
      setError(null);
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    setLoading(true);
    setAvailability(null);
    setInteractions([]);
    setError(null);
    setPendingQuestion(null);
    setRevealInteractionId(null);
    pendingRequest.current = null;
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = availability?.pendingInteractionId;
    if (!id) return;
    const timer = window.setInterval(async () => {
      try {
        const interaction = await getAssistantInteraction(assignmentId, id);
        if (interaction.status !== "PENDING") {
          if (interaction.status === "COMPLETED" || interaction.status === "REDIRECTED") window.dispatchEvent(new Event("assistant-usage-changed"));
          setRevealInteractionId(interaction.id);
          await refresh();
        }
      } catch { /* Next refresh remains available to student. */ }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [assignmentId, availability?.pendingInteractionId, refresh]);

  async function loadOlder() {
    if (nextPage === null) return;
    try {
      const page = await listAssistantHistory(assignmentId, nextPage);
      setInteractions((current) => [...page.content.slice().reverse().filter((item) =>
        !current.some((known) => known.id === item.id)), ...current]);
      setNextPage(page.last ? null : nextPage + 1);
    } catch (cause) { setError(describeError(cause)); }
  }

  async function submit(message: string, language: Language, editorCode: string,
    includeEditorCode: boolean, includeExecutionContext: boolean) {
    if (sendingRef.current || !availability?.available || !message.trim()
      || (includeEditorCode && (!editorCode.trim() || editorCode.length > 32768))) return;
    const request: AssistantMessageRequest = {
      clientRequestId: crypto.randomUUID(), message: message.trim(), language,
      includeEditorCode, includeExecutionContext,
      ...(includeEditorCode ? { editorCode } : {}),
    };
    pendingRequest.current = request;
    setPendingQuestion(request.message);
    await send(request);
  }

  async function send(request: AssistantMessageRequest) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      const result = await sendAssistantMessage(assignmentId, request);
      if (result.interaction.status === "COMPLETED" || result.interaction.status === "REDIRECTED") window.dispatchEvent(new Event("assistant-usage-changed"));
      setLastResult(result);
      setAvailability(result.availability);
      if (result.interaction.status !== "PENDING") {
        setRevealInteractionId(result.interaction.id);
        pendingRequest.current = null;
        setInteractions((current) => [...current.filter((item) => item.id !== result.interaction.id), result.interaction]);
      } else {
        await refresh();
      }
    } catch (cause) {
      setError(describeError(cause));
      await refresh();
      setError(describeError(cause));
    } finally {
      setPendingQuestion(null);
      sendingRef.current = false;
      setSending(false);
    }
  }

  return { availability, interactions, loading, sending, error, lastResult, nextPage, pendingQuestion, revealInteractionId,
    refresh, loadOlder, submit, retry: () => pendingRequest.current ? send(pendingRequest.current) : refresh(),
    hasRetry: pendingRequest.current !== null };
}
