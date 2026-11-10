import { CircleCheck, LoaderCircle, Undo2, Upload } from "lucide-react";
import type { Verdict } from "../utils/submission-state";

export const VERDICT_LABELS: Record<Verdict, string> = {
  AC: "Accepted",
  WA: "Wrong answer",
  TLE: "Time limit",
  MLE: "Memory limit",
  OLE: "Output limit",
  RTE: "Runtime error",
  CE: "Compilation error",
  PENDING: "Evaluating",
};

const VERDICT_TONES: Record<Verdict, string> = {
  AC: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  WA: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  TLE: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  MLE: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  OLE: "border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-400",
  RTE: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  CE: "border-yellow-500/40 bg-yellow-500/10 text-yellow-800 dark:text-yellow-400",
  PENDING: "border-gray-500/30 bg-gray-500/10 text-gray-600 dark:text-gray-300",
};

const PILL = "inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap";

/** Evaluation result. `compact` shows the short code and keeps the full name for assistive tech and hover. */
export function VerdictBadge({ verdict, compact = false }: { verdict: Verdict; compact?: boolean }) {
  const label = VERDICT_LABELS[verdict];
  if (compact && verdict !== "PENDING") {
    return <span className={`${PILL} font-mono ${VERDICT_TONES[verdict]}`} title={label}><span aria-hidden="true">{verdict}</span><span className="sr-only">{label}</span></span>;
  }
  return (
    <span className={`${PILL} ${VERDICT_TONES[verdict]}`}>
      {verdict === "PENDING" && <LoaderCircle size={11} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {label}
    </span>
  );
}

export type AttemptKind = "current" | "withdrawn" | "new";

const ATTEMPT_KINDS: Record<AttemptKind, { label: string; className: string; icon: typeof CircleCheck }> = {
  // The attempt that counts wears the brand accent; the others stay neutral.
  current: { label: "Current", className: "border-azure/40 bg-azure/10 text-azure dark:border-yellow/40 dark:bg-yellow/10 dark:text-yellow", icon: CircleCheck },
  withdrawn: { label: "Withdrawn", className: "border-gray-400/40 bg-gray-500/10 text-gray-600 dark:text-gray-400", icon: Undo2 },
  new: { label: "New", className: "border-dashed border-gray-400 text-gray-700 dark:border-gray-500 dark:text-gray-200", icon: Upload },
};

/** Whether an attempt counts (current), no longer counts (withdrawn), or is about to be sent (new). */
export function AttemptBadge({ kind }: { kind: AttemptKind }) {
  const { label, className, icon: Icon } = ATTEMPT_KINDS[kind];
  return <span className={`${PILL} ${className}`}><Icon size={11} aria-hidden="true" />{label}</span>;
}
