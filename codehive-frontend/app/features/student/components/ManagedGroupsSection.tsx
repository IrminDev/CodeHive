import { BarChart3, KeyRound, Plus, Presentation, Settings2 } from "lucide-react";
import { Link } from "react-router";

import type { ClassGroup } from "../types/group.types";

export function ManagedGroupsSection({ groups }: { groups: ClassGroup[] }) {
  return (
    <section aria-labelledby="managed-groups-title" className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <h2 id="managed-groups-title" className="text-lg font-bold text-gray-900 dark:text-white">Groups you manage</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Groups you created. Manage their roster, assignments, and grades, or review their analytics.</p>
        </div>
        <Link to="/teacher/groups/create" className="inline-flex self-start sm:self-auto items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french transition-colors"><Plus size={13} /> Create group</Link>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <Presentation className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={28} />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">No managed groups yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create a group to get a join code you can share with students.</p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface divide-y divide-gray-100 dark:divide-gray-800/60">
          {groups.map((group) => <ManagedGroupRow key={group.id} group={group} />)}
        </ul>
      )}
    </section>
  );
}

function ManagedGroupRow({ group }: { group: ClassGroup }) {
  const stateClass = group.archived
    ? "bg-gray-500/10 text-gray-500 border-gray-500/20"
    : "bg-green-500/10 text-green-500 border-green-500/20";
  const actionClass = "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors";

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{group.name}</h3>
          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${stateClass}`}>{group.archived ? "Read-only" : "Active"}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{group.description || "No group description provided."}</p>
        {group.joinCode && !group.archived && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <KeyRound size={13} aria-hidden /> Join code <span className="font-mono font-semibold text-gray-800 dark:text-gray-100">{group.joinCode}</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to={`/teacher/analytics?groupId=${encodeURIComponent(group.id)}`} className={actionClass}><BarChart3 size={13} /> Analytics</Link>
        <Link to={`/teacher/groups/${encodeURIComponent(group.id)}`} className={actionClass}><Settings2 size={13} /> Manage</Link>
      </div>
    </li>
  );
}
