import type { Ref } from "react";
import { CircleCheck, CircleDashed, LoaderCircle, Undo2 } from "lucide-react";
import type { SubmissionState } from "../utils/submission-state";
import { VERDICT_LABELS, VerdictBadge } from "./SubmissionBadges";

const NEUTRAL = "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-azure hover:text-azure dark:hover:border-gray-400 dark:hover:text-gray-100";
const WARNING = "border-orange-500/40 text-orange-700 dark:text-orange-400 hover:bg-orange-500/10";

/** Header control that states which attempt counts right now and opens the submission dialog. */
export function SubmissionStatusButton({ state, onOpen, ref }: { state: SubmissionState; onOpen: () => void; ref?: Ref<HTMLButtonElement> }) {
  const { phase, current, previous } = state;
  const status = phase === "active" && current
    ? { label: "Submitted", detail: `attempt #${current.number} counts, ${VERDICT_LABELS[current.verdict]}`, tone: NEUTRAL, icon: <CircleCheck size={14} aria-hidden="true" /> }
    : phase === "evaluating"
    ? { label: "Evaluating", detail: `attempt #${current?.number ?? 1} is being evaluated`, tone: NEUTRAL, icon: <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> }
    : phase === "withdrawn"
    ? { label: "Withdrawn", detail: `attempt #${previous[0]?.number ?? 1} was withdrawn, nothing counts as delivered`, tone: WARNING, icon: <Undo2 size={14} aria-hidden="true" /> }
    : { label: "Not submitted", detail: "nothing submitted yet", tone: NEUTRAL, icon: <CircleDashed size={14} aria-hidden="true" /> };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`Submission: ${status.detail}. Open details`}
      title={`Submission: ${status.detail}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow ${status.tone}`}
    >
      {status.icon}
      <span className="hidden lg:inline">{status.label}</span>
      {/* The negative margin keeps the control as tall as its header neighbours. */}
      {phase === "active" && current && <span className="-my-1 inline-flex"><VerdictBadge verdict={current.verdict} compact /></span>}
    </button>
  );
}
