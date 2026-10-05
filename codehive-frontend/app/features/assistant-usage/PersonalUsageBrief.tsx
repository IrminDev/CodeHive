import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { usageRequest } from "./api";
import type { Summary } from "./types";
export function PersonalUsageBrief({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<{ scope: string; summary: Summary }>();
  const scope = `${user?.id}:${groupId}`;
  useEffect(() => {
    const controller = new AbortController(); setData(undefined);
    void usageRequest<Summary>("personal", `/api/assistant-usage/me/groups/${encodeURIComponent(groupId)}`, controller.signal)
      .then(summary => { if (!controller.signal.aborted) setData({ scope, summary }); }).catch(() => { /* Detailed page provides retry and access errors. */ });
    return () => controller.abort();
  }, [groupId, scope]);
  return <section className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-sm"><h2 className="font-semibold">AI answer usage</h2>
    {data?.scope === scope && <p>{data.summary.educational.responses} answers used · {data.summary.educational.requests} questions in the last 30 days.</p>}
    <p>Answer quota belongs to each assignment and lasts for its lifetime.</p><Link className="underline text-azure dark:text-yellow" to={`/ai-usage?groupId=${groupId}`}>My AI usage for this group</Link></section>;
}
