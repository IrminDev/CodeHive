import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { CalendarDays, ChevronRight, CircleAlert, Plus, RefreshCw, UserRound, Users } from "lucide-react";

import { listMyGroups } from "../api/group.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { ClassGroup } from "../types/group.types";

const GROUP_COLORS = ["bg-azure", "bg-french", "bg-imperial", "bg-yellow text-dark-bg"];

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export function MyGroupsPage() {
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await listMyGroups());
    } catch (cause) {
      setGroups([]);
      setError(cause instanceof Error ? cause.message : "Could not load your groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="groups" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "My groups" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3"><Users size={13} className="text-yellow" /> YOUR CLASSES</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My groups</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Open a group to review assignments and delivery progress.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50"><RefreshCw size={13} /> Refresh</button>
                <Link to="/groups/join" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french transition-colors"><Plus size={13} /> Join group</Link>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2].map((item) => <div key={item} className="h-52 rounded-2xl bg-gray-100 dark:bg-dark-surface animate-pulse" />)}</div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert className="mx-auto text-red-500 mb-3" size={28} /><h2 className="font-semibold">Could not load groups</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p><button onClick={() => void load()} className="btn-primary mt-5">Try again</button></div>
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center"><Users className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={30} /><h2 className="font-semibold text-gray-800 dark:text-gray-100">No groups yet</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Ask your teacher for a join code to get started.</p><Link to="/groups/join" className="btn-primary inline-flex mt-5">Join a group</Link></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.map((group, index) => <GroupCard key={group.id} group={group} color={GROUP_COLORS[index % GROUP_COLORS.length]} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function GroupCard({ group, color }: { group: ClassGroup; color: string }) {
  const state = group.archived ? "Read-only" : group.isActive ? "Active" : "Inactive";
  const stateClass = group.archived ? "bg-gray-500/10 text-gray-500 border-gray-500/20" : group.isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20";
  return (
    <Link to={`/groups/${group.id}`} className="group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface hover:border-azure/50 dark:hover:border-yellow/50 hover:-translate-y-0.5 transition-all">
      <div className={`${color} h-24 p-5 flex items-end justify-between text-white relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
        <h2 className="relative font-bold text-lg truncate">{group.name}</h2>
        <ChevronRight className="relative opacity-80" size={18} />
      </div>
      <div className="p-5">
        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${stateClass}`}>{state}</span>
        <p className="mt-3 h-10 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{group.description || "No group description provided."}</p>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60 space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <p className="flex items-center gap-2"><UserRound size={13} /> {group.ownerName || "Teacher"}</p>
          <p className="flex items-center gap-2"><CalendarDays size={13} /> Created {formatDate(group.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}
