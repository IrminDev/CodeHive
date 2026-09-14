import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { listAdminUsers } from "../api/admin.api";
import type { AdminUserSummary } from "../types/admin.types";
import { inputClass } from "./AdminUI";

export function AdminUserFilter({ label, selectedId, onSelect }: { label: string; selectedId?: string; onSelect: (id?: string) => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (query.trim().length < 2 || selectedId) { setUsers([]); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void listAdminUsers({ search: query.trim(), size: 8, sort: "name", direction: "ASC" }, controller.signal)
        .then((page) => { setUsers(page.content); setOpen(true); })
        .catch(() => setUsers([]));
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, selectedId]);

  if (selectedId) return <div><span className="block text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-1.5">{label}</span><div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-gray-100 dark:bg-dark-card px-3 py-2.5 text-xs">{selectedId}</code><button onClick={() => { onSelect(undefined); setQuery(""); }} className="w-9 h-9 grid place-items-center rounded-lg border border-gray-200 dark:border-gray-700" aria-label={`Clear ${label}`}><X size={14} /></button></div></div>;
  return <label className="relative block"><span className="block text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-1.5">{label}</span><Search size={15} className="absolute left-3 top-9 text-gray-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onBlur={() => window.setTimeout(() => setOpen(false), 150)} placeholder="Search visible users…" className={`${inputClass} py-2.5 pl-9`} />{open && users.length > 0 && <div className="absolute z-20 top-full mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-xl overflow-hidden">{users.map((user) => <button type="button" key={user.id} onMouseDown={() => { onSelect(user.id); setQuery(`${user.name} ${user.lastName}`); setOpen(false); }} className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-dark-surface"><span className="block text-sm font-medium truncate">{user.name} {user.lastName}</span><span className="block text-xs text-gray-500 truncate">{user.email} · {user.enrollmentNumber}</span></button>)}</div>}</label>;
}
