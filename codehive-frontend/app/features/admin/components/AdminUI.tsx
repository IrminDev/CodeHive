import { useEffect, useRef, type ReactNode } from "react";
import { CircleAlert, Inbox, LoaderCircle, X } from "lucide-react";

export const panelClass = "rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface";
export const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow disabled:cursor-not-allowed disabled:opacity-50";
export const compactButtonClass = "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow disabled:opacity-50 disabled:cursor-not-allowed";
export const primaryCompactClass = "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow disabled:opacity-50 disabled:cursor-not-allowed";

export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6"><div className="min-w-0">{eyebrow && <p className="text-[10px] uppercase tracking-widest font-semibold text-azure dark:text-yellow mb-2">{eyebrow}</p>}<h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{description}</p></div>{actions && <div className="flex flex-wrap gap-2 flex-shrink-0">{actions}</div>}</div>;
}

export function AdminLoading({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-4 animate-pulse" aria-label="Loading"><div className="h-24 rounded-2xl bg-gray-100 dark:bg-dark-surface" />{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-20 rounded-2xl bg-gray-100 dark:bg-dark-surface" />)}</div>;
}

export function AdminEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className={`${panelClass} p-10 text-center`}><Inbox size={28} className="mx-auto text-gray-300 dark:text-gray-700" /><h2 className="mt-3 font-semibold text-gray-900 dark:text-white">{title}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>{action && <div className="mt-5 flex justify-center">{action}</div>}</div>;
}

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert size={28} className="mx-auto text-red-500" /><h2 className="mt-3 font-semibold">Could not load this page</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>{onRetry && <button onClick={onRetry} className="btn-primary mt-5">Try again</button>}</div>;
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "success" | "warning" | "error" | "info" | "neutral" }) {
  const styles = { success: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", warning: "bg-yellow/10 text-yellow-700 dark:text-yellow border-yellow/20", error: "bg-red-500/10 text-red-500 border-red-500/20", info: "bg-azure/10 text-azure dark:text-yellow border-azure/20 dark:border-yellow/20", neutral: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${styles[tone]}`}>{label}</span>;
}

export function AdminDialog({ open, title, description, children, busy = false, confirmLabel, danger = false, confirmDisabled = false, onCancel, onConfirm }: {
  open: boolean; title: string; description?: string; children?: ReactNode; busy?: boolean; confirmLabel: string; danger?: boolean; confirmDisabled?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [busy, onCancel, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-dark-bg/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title"><div ref={panelRef} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="admin-dialog-title" className="text-lg font-semibold">{title}</h2>{description && <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>}</div><button ref={closeRef} onClick={onCancel} disabled={busy} className="w-8 h-8 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface" aria-label="Close"><X size={17} /></button></div>{children && <div className="mt-5">{children}</div>}<div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} disabled={busy} className={compactButtonClass}>Cancel</button><button onClick={onConfirm} disabled={busy || confirmDisabled} className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-azure hover:bg-french"}`}>{busy && <LoaderCircle size={14} className="animate-spin" />}{confirmLabel}</button></div></div></div>;
}

export function Pagination({ page, totalPages, totalElements, onPage }: { page: number; totalPages: number; totalElements: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return <p className="text-xs text-gray-400">{totalElements} result{totalElements === 1 ? "" : "s"}</p>;
  return <div className="flex items-center justify-between gap-3"><p className="text-xs text-gray-500 dark:text-gray-400">Page {page + 1} of {totalPages} · {totalElements} results</p><div className="flex gap-2"><button className={compactButtonClass} disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button><button className={compactButtonClass} disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>Next</button></div></div>;
}
