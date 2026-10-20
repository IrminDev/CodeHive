import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { BackLink } from "~/shared/components/BackLink";
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

  return <main className="min-h-screen bg-white text-gray-900 dark:bg-dark-bg dark:text-gray-100">
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      {/* History-aware: opened from an assignment, this returns there with the editor draft intact. */}
      <BackLink fallback="/assignments" fallbackLabel="My assignments" />
      <header className="mt-4 border-b border-gray-200 pb-5 dark:border-gray-800/60">
        <h1 className="text-xl font-bold">AI assistant history</h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Questions remain readable while group is active, even when new assistance ends. Archived or deleted groups retain metadata only.</p>
        {availability && <div className="mt-3"><AssistantQuota availability={availability} /></div>}
      </header>
      {loading && <p role="status" className="mt-6 text-sm text-gray-500 dark:text-gray-400">Loading conversation…</p>}
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">No questions yet.</p>}
      {!loading && hasMore && <div className="mt-6 flex justify-center"><button type="button" onClick={() => void loadOlder()} className="inline-flex min-h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-yellow">Load older questions</button></div>}
      <div className="mt-6 space-y-8" aria-label="Conversation">{items.map((item) => <AssistantMessage key={item.id} interaction={item} />)}</div>
    </div>
  </main>;
}
