import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getAssistantAvailability, listAssistantHistory } from "../api/assistant.api";
import { AssistantMessage } from "../components/AssistantMessage";
import { AssistantQuota } from "../components/AssistantQuota";
import type { AssistantAvailability, AssistantInteraction } from "../types/assistant.types";

/** Loads by conversation ownership, without the assignment-workspace read endpoint. */
export function AssistantHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [availability, setAvailability] = useState<AssistantAvailability | null>(null);
  const [items, setItems] = useState<AssistantInteraction[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([getAssistantAvailability(id), listAssistantHistory(id)]).then(([state, history]) => {
      if (!active) return;
      setAvailability(state);
      setItems(history.content.slice().reverse());
      setPage(0);
      setHasMore(!history.last);
      setError(null);
    }).catch(() => {
      if (active) setError("Could not load this conversation. Check access and try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function loadOlder() {
    if (!id || !hasMore) return;
    try {
      const older = await listAssistantHistory(id, page + 1);
      setItems((current) => [...older.content.slice().reverse(), ...current]);
      setPage(page + 1);
      setHasMore(!older.last);
      setError(null);
    } catch { setError("Could not load older questions. Try again."); }
  }

  return <main className="min-h-screen bg-white p-4 text-gray-900 dark:bg-dark-bg dark:text-gray-100 sm:p-8">
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/assignments" className="text-sm text-azure">← My assignments</Link>
      <h1 className="text-xl font-bold">AI assistant history</h1>
      <p className="text-sm text-gray-500">Questions remain readable while group is active, even when new assistance ends. Archived or deleted groups retain metadata only.</p>
      {availability && <AssistantQuota availability={availability} />}
      {loading && <p role="status">Loading conversation…</p>}
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && <p>No questions yet.</p>}
      {!loading && hasMore && <button type="button" onClick={() => void loadOlder()} className="text-sm text-azure">Load older questions</button>}
      <div className="space-y-6" aria-label="Conversation">{items.map((item) => <AssistantMessage key={item.id} interaction={item} />)}</div>
    </div>
  </main>;
}
