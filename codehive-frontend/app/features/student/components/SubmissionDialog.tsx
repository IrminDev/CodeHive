import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowDown, ArrowRight, Circle, CircleCheck, CircleX, FileCheck2, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import {
  replacementEffects,
  type OperationStep,
  type SubmissionAttempt,
  type SubmissionOperation,
  type SubmissionState,
} from "../utils/submission-state";
import { AttemptBadge, VERDICT_LABELS, VerdictBadge } from "./SubmissionBadges";

type View = "overview" | "confirm-replace" | "confirm-withdraw";

const LANGUAGE_NAMES: Record<string, string> = { JAVA: "Java", PYTHON: "Python", CPP: "C++", C: "C" };
const PRIMARY = "inline-flex items-center justify-center gap-2 rounded-xl bg-azure px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-french disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-card";
const SECONDARY = "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-azure hover:text-azure disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-yellow dark:hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow";
const CAUTION = "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-card";
const TEXT_LINK = "rounded text-xs font-semibold text-azure underline-offset-2 hover:underline dark:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow";

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
}

export interface SubmissionDialogProps {
  assignmentId: string;
  assignmentTitle: string;
  state: SubmissionState;
  /** "replace" opens straight on the replacement confirmation. */
  initialView: "overview" | "replace";
  operation: SubmissionOperation | null;
  editor: { language: string; lines: number; empty: boolean };
  /** Whether the assignment accepts a submission right now, and why not when it does not. */
  canSubmitNew: boolean;
  submitBlockReason: string | null;
  onClose: () => void;
  onReplace: () => void;
  onWithdraw: () => void;
  onRetrySubmit: () => void;
  onSubmitNew: () => void;
  onViewResults: () => void;
}

export function SubmissionDialog(props: SubmissionDialogProps) {
  const { state, operation, onClose } = props;
  const [view, setView] = useState<View>(props.initialView === "replace" && state.canWithdraw ? "confirm-replace" : "overview");
  const panel = useRef<HTMLDivElement>(null);
  // Between sending the request and getting an answer the outcome is unknown, so the dialog stays put.
  const locked = operation?.phase === "withdrawing" || operation?.phase === "submitting";
  const screen = operation ? "progress" : view;

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => opener?.focus();
  }, []);

  useEffect(() => { panel.current?.focus(); }, [screen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (!locked) onClose();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    const items = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (items.length === 0) { event.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const focused = document.activeElement;
    if (event.shiftKey && (focused === first || focused === panel.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && focused === last) { event.preventDefault(); first.focus(); }
  }

  const attempt = operation?.previous ?? state.current;
  const title = operation
    ? operationTitle(operation)
    : view === "confirm-replace" ? `Replace attempt #${attempt?.number ?? ""}?`
    : view === "confirm-withdraw" ? `Withdraw attempt #${attempt?.number ?? ""}?`
    : "Your submission";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-dark-bg/50 backdrop-blur-sm p-4" onKeyDown={handleKeyDown}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-dialog-title"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl outline-none dark:border-gray-700/60 dark:bg-dark-card"
      >
        <header className="flex flex-shrink-0 items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700/60">
          <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"><FileCheck2 size={18} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="submission-dialog-title" className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{props.assignmentTitle}</p>
          </div>
          <button type="button" onClick={onClose} disabled={locked} aria-label="Close" className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow">
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {operation ? (
          <Progress {...props} operation={operation} />
        ) : view === "confirm-replace" && state.current ? (
          <ConfirmReplace {...props} current={state.current} onBack={() => (props.initialView === "replace" ? onClose() : setView("overview"))} />
        ) : view === "confirm-withdraw" && state.current ? (
          <ConfirmWithdraw {...props} current={state.current} onBack={() => setView("overview")} onReplaceInstead={() => setView("confirm-replace")} />
        ) : (
          <Overview {...props} onAskReplace={() => setView("confirm-replace")} onAskWithdraw={() => setView("confirm-withdraw")} />
        )}
      </div>
    </div>
  );
}

function operationTitle(operation: SubmissionOperation): string {
  if (operation.phase === "failed") return operation.failedStep === "evaluate" ? "Submitted, result pending" : operation.kind === "replace" ? "Replacement not completed" : "Withdrawal not completed";
  if (operation.phase === "done") return operation.kind === "replace" ? "Submission replaced" : "Submission withdrawn";
  return operation.kind === "replace" ? "Replacing your submission" : "Withdrawing your submission";
}

/* ── Overview ── */

function Overview({
  assignmentId, state, editor, canSubmitNew, submitBlockReason, onSubmitNew, onAskReplace, onAskWithdraw,
}: SubmissionDialogProps & { onAskReplace: () => void; onAskWithdraw: () => void }) {
  const { phase, current, previous } = state;
  const total = previous.length + (current ? 1 : 0);
  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {current ? <CurrentAttempt assignmentId={assignmentId} state={state} attempt={current} /> : <NothingDelivered state={state} />}

        {previous.length > 0 && (
          <section aria-labelledby="submission-earlier">
            <h3 id="submission-earlier" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{current ? "Earlier attempts" : "Attempts"}</h3>
            <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-700/60 dark:border-gray-700/60">
              {previous.slice(0, 3).map((item) => (
                <li key={item.submissionId} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3 py-2 text-xs">
                  <span className="font-mono font-semibold text-gray-500 dark:text-gray-400">#{item.number}</span>
                  <VerdictBadge verdict={item.verdict} />
                  <AttemptBadge kind="withdrawn" />
                  <span className="text-gray-500 dark:text-gray-400">{item.withdrawnAt ? formatDate(item.withdrawnAt) : `submitted ${formatDate(item.submittedAt)}`}</span>
                  {item.executionId && item.reportAvailable && <Link to={`/assignment/${assignmentId}/report/${item.executionId}?num=${item.number}`} className={`${TEXT_LINK} ml-auto`}>Report</Link>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {phase === "active" && current && (
          <section aria-labelledby="submission-change" className="border-t border-gray-200 pt-4 dark:border-gray-700/60">
            <h3 id="submission-change" className="text-sm font-semibold text-gray-900 dark:text-white">Send a new version</h3>
            {state.canWithdraw ? (
              <>
                <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Only one attempt counts at a time. Replacing withdraws attempt #{current.number} and submits the code in your editor in its place. You review what changes before anything is sent.</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" onClick={onAskReplace} className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-french focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-card">Replace with editor code…</button>
                  <button type="button" onClick={onAskWithdraw} className={TEXT_LINK}>Withdraw without replacing…</button>
                </div>
              </>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">The assignment closed on {formatDate(state.closeDate)}. Attempt #{current.number} is final and can no longer be changed.</p>
            )}
          </section>
        )}

        {!current && (
          <section className="border-t border-gray-200 pt-4 dark:border-gray-700/60">
            <button type="button" onClick={onSubmitNew} disabled={!canSubmitNew || editor.empty} className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-french disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-card">Submit editor code as attempt #{state.nextNumber}</button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{!canSubmitNew ? submitBlockReason : editor.empty ? "Your editor is empty." : `${editor.language} · ${editor.lines} ${editor.lines === 1 ? "line" : "lines"} in your editor.`}</p>
          </section>
        )}
      </div>
      {total > 0 && (
        <footer className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 dark:border-gray-700/60">
          <span className="text-xs text-gray-500 dark:text-gray-400">{total} {total === 1 ? "attempt" : "attempts"} so far</span>
          <Link to={`/assignment/${assignmentId}/submissions`} className={TEXT_LINK}>Open full history</Link>
        </footer>
      )}
    </>
  );
}

function CurrentAttempt({ assignmentId, state, attempt }: { assignmentId: string; state: SubmissionState; attempt: SubmissionAttempt }) {
  const evaluating = state.phase === "evaluating";
  const { grade } = state;
  const performance = [attempt.timeMs != null ? `${attempt.timeMs} ms` : null, attempt.memoryMb != null && attempt.memoryMb > 0 ? `${attempt.memoryMb} MB` : null].filter(Boolean).join(" · ");
  return (
    <section aria-labelledby="submission-current" className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700/60 dark:bg-dark-surface">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <AttemptBadge kind="current" />
        <h3 id="submission-current" className="text-sm font-semibold text-gray-900 dark:text-white">Attempt #{attempt.number}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">counts as your submission</span>
      </div>
      <dl className="divide-y divide-gray-200 border-t border-gray-200 text-xs dark:divide-gray-700/60 dark:border-gray-700/60">
        <Row label="Result">
          <VerdictBadge verdict={attempt.verdict} />
          {evaluating ? <span className="text-gray-500 dark:text-gray-400">This usually takes a few seconds.</span> : performance && <span className="font-mono text-gray-500 dark:text-gray-400">{performance}</span>}
          {attempt.executionId && attempt.reportAvailable && <Link to={`/assignment/${assignmentId}/report/${attempt.executionId}?num=${attempt.number}`} className={`${TEXT_LINK} ml-auto`}>View report</Link>}
        </Row>
        <Row label="Submitted">
          <span>{formatDate(attempt.submittedAt)}{attempt.language ? ` · ${LANGUAGE_NAMES[attempt.language] ?? attempt.language}` : ""}</span>
          {attempt.deliveredLate
            ? <span className="font-semibold text-orange-700 dark:text-orange-400">Late{state.dueDate ? ` — due ${formatDate(state.dueDate)}` : ""}</span>
            : <span className="text-gray-500 dark:text-gray-400">On time</span>}
        </Row>
        <Row label="Grade">
          {grade ? (
            <>
              <span className="font-semibold text-gray-900 dark:text-white">{grade.value} / {grade.maxPoints}</span>
              <span className="text-gray-500 dark:text-gray-400">{grade.submissionId && grade.submissionId !== attempt.submissionId ? "returned for an earlier attempt" : `returned ${formatDate(grade.returnedAt ?? grade.updatedAt)}`}</span>
              <Link to={`/grades?assignmentId=${assignmentId}`} className={`${TEXT_LINK} ml-auto`}>View grade</Link>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Not returned yet. Your teacher grades the attempt that counts.</span>
          )}
        </Row>
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-2.5">
      <dt className="w-20 flex-shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 text-gray-700 dark:text-gray-200">{children}</dd>
    </div>
  );
}

function NothingDelivered({ state }: { state: SubmissionState }) {
  const last = state.previous[0];
  if (!last) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 px-4 py-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nothing submitted yet</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Submitting sends the code in your editor to be evaluated against the full test suite. {deadlineSentence(state)}</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-orange-500/30 bg-orange-500/5 px-4 py-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-800 dark:text-orange-300"><TriangleAlert size={15} aria-hidden="true" />No attempt counts right now</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">Attempt #{last.number} was withdrawn{last.withdrawnAt ? ` on ${formatDate(last.withdrawnAt)}` : ""}. It stays in your history, but nothing is delivered for this assignment. {deadlineSentence(state)}</p>
      {state.grade && <p className="mt-1.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">Your returned grade ({state.grade.value} / {state.grade.maxPoints}) belongs to a withdrawn attempt and is cleared when you submit again.</p>}
    </section>
  );
}

function deadlineSentence(state: SubmissionState): string {
  if (state.closed) return `The assignment closed on ${formatDate(state.closeDate)}, so nothing more can be submitted.`;
  const late = state.pastDue ? ` The due date passed on ${formatDate(state.dueDate)}, so the next submission is marked late.` : state.dueDate ? ` Due ${formatDate(state.dueDate)}.` : "";
  return state.closeDate ? `You can submit until ${formatDate(state.closeDate)}.${late}` : late.trim();
}

/* ── Confirmations ── */

function ConfirmReplace({ state, editor, current, onReplace, onBack }: SubmissionDialogProps & { current: SubmissionAttempt; onBack: () => void }) {
  const effects = replacementEffects(state);
  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <AttemptCard badge={<AttemptBadge kind="current" />} title={`Attempt #${current.number}`} outcome="Becomes withdrawn">
            <VerdictBadge verdict={current.verdict} />
            <span>{current.deliveredLate ? "Late" : "On time"}</span>
            {state.grade && <span>Grade {state.grade.value} / {state.grade.maxPoints}</span>}
          </AttemptCard>
          <span className="grid place-items-center text-gray-400 dark:text-gray-500" aria-hidden="true"><ArrowRight size={18} className="hidden sm:block" /><ArrowDown size={18} className="sm:hidden" /></span>
          <AttemptCard badge={<AttemptBadge kind="new" />} title={`Attempt #${state.nextNumber}`} outcome="Becomes your submission">
            <span>{editor.language} · {editor.lines} {editor.lines === 1 ? "line" : "lines"}</span>
            <span>Not evaluated yet</span>
            <span className={effects.marksLate ? "font-semibold text-orange-700 dark:text-orange-400" : undefined}>{effects.marksLate ? "Late" : "On time"}</span>
          </AttemptCard>
        </div>

        <ul className="space-y-2.5">
          <Effect>Attempt #{current.number} stays in your history with its result, but it stops counting and cannot be restored.</Effect>
          <Effect warning={effects.replacesAccepted}>{effects.replacesAccepted ? `Attempt #${current.number} passed every test. The new attempt counts even if it fails.` : "The new attempt counts whatever its result is."}</Effect>
          {effects.marksLate && <Effect warning>The due date passed on {formatDate(state.dueDate)}. {effects.losesOnTime ? `Attempt #${current.number} is on time; the new attempt` : "The new attempt"} will be marked late.</Effect>}
          {effects.clearsGrade && state.grade && <Effect warning>Your returned grade ({state.grade.value} / {state.grade.maxPoints}) is cleared. Your teacher has to grade the new attempt.</Effect>}
        </ul>
        {editor.empty && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-400">Your editor is empty. Write the new version before replacing.</p>}
      </div>
      <Actions>
        <button type="button" onClick={onBack} className={SECONDARY}>Keep attempt #{current.number}</button>
        <button type="button" onClick={onReplace} disabled={editor.empty} className={PRIMARY}>Withdraw and submit</button>
      </Actions>
    </>
  );
}

function ConfirmWithdraw({ state, current, onWithdraw, onBack, onReplaceInstead }: SubmissionDialogProps & { current: SubmissionAttempt; onBack: () => void; onReplaceInstead: () => void }) {
  const effects = replacementEffects(state);
  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <AttemptCard badge={<AttemptBadge kind="current" />} title={`Attempt #${current.number}`} outcome="Becomes withdrawn">
          <VerdictBadge verdict={current.verdict} />
          <span>{current.deliveredLate ? "Late" : "On time"}</span>
          {state.grade && <span>Grade {state.grade.value} / {state.grade.maxPoints}</span>}
        </AttemptCard>
        <ul className="space-y-2.5">
          <Effect>Attempt #{current.number} stays in your history with its result, but it stops counting and cannot be restored.</Effect>
          <Effect warning>{state.closeDate ? `If you do not submit again before ${formatDate(state.closeDate)}, nothing is delivered for this assignment.` : "Until you submit again, nothing is delivered for this assignment."}</Effect>
          {effects.marksLate && <Effect warning>The due date passed on {formatDate(state.dueDate)}. {effects.losesOnTime ? `Attempt #${current.number} is on time; whatever` : "Whatever"} you submit next will be marked late.</Effect>}
          {effects.clearsGrade && state.grade && <Effect warning>Your returned grade ({state.grade.value} / {state.grade.maxPoints}) is cleared when you submit again.</Effect>}
        </ul>
        <p className="text-xs text-gray-600 dark:text-gray-400">Already have the new version in your editor? <button type="button" onClick={onReplaceInstead} className={TEXT_LINK}>Replace it in one step instead</button></p>
      </div>
      <Actions>
        <button type="button" onClick={onBack} className={SECONDARY}>Keep attempt #{current.number}</button>
        <button type="button" onClick={onWithdraw} className={CAUTION}>Withdraw attempt #{current.number}</button>
      </Actions>
    </>
  );
}

function AttemptCard({ badge, title, outcome, children }: { badge: ReactNode; title: string; outcome: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-700/60 dark:bg-dark-surface">
      <div className="flex flex-wrap items-center gap-2">{badge}<span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span></div>
      <div className="mt-2 flex flex-1 flex-wrap content-start items-center gap-x-2.5 gap-y-1 text-xs text-gray-600 dark:text-gray-300">{children}</div>
      <p className="mt-3 border-t border-gray-200 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700/60 dark:text-gray-400">{outcome}</p>
    </div>
  );
}

function Effect({ warning = false, children }: { warning?: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
      {warning
        ? <TriangleAlert size={16} className="mt-0.5 flex-shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
        : <Info size={16} className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />}
      <span>{warning && <span className="sr-only">Important: </span>}{children}</span>
    </li>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <footer className="flex flex-shrink-0 flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700/60 sm:flex-row sm:justify-end sm:gap-3">{children}</footer>;
}

/* ── Progress and outcome ── */

const STEP_ORDER: OperationStep[] = ["withdraw", "submit", "evaluate"];

type StepStatus = "done" | "running" | "failed" | "pending";

function stepStatus(operation: SubmissionOperation, step: OperationStep): StepStatus {
  const index = STEP_ORDER.indexOf(step);
  if (operation.phase === "done") return "done";
  const reached = operation.phase === "failed"
    ? STEP_ORDER.indexOf(operation.failedStep ?? "withdraw")
    : operation.phase === "withdrawing" ? 0 : operation.phase === "submitting" ? 1 : 2;
  if (index < reached) return "done";
  if (index > reached) return "pending";
  return operation.phase === "failed" ? "failed" : "running";
}

function Progress({ assignmentId, state, operation, onClose, onReplace, onWithdraw, onRetrySubmit, onViewResults }: SubmissionDialogProps & { operation: SubmissionOperation }) {
  const { previous, newNumber, kind, phase } = operation;
  const steps: Array<{ step: OperationStep; label: string }> = kind === "replace"
    ? [
      { step: "withdraw", label: `Withdraw attempt #${previous.number}` },
      { step: "submit", label: `Submit your editor code as attempt #${newNumber}` },
      { step: "evaluate", label: "Evaluate it against the test suite" },
    ]
    : [{ step: "withdraw", label: `Withdraw attempt #${previous.number}` }];
  const outcome = operationOutcome(operation, state);

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <ol className="space-y-2.5">
          {steps.map(({ step, label }) => {
            const status = stepStatus(operation, step);
            return (
              <li key={step} className={`flex items-center gap-2.5 text-sm ${status === "pending" ? "text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}>
                {status === "done" ? <CircleCheck size={17} className="flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                  : status === "running" ? <LoaderCircle size={17} className="flex-shrink-0 animate-spin text-azure motion-reduce:animate-none dark:text-yellow" aria-hidden="true" />
                  : status === "failed" ? <CircleX size={17} className="flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                  : <Circle size={17} className="flex-shrink-0" aria-hidden="true" />}
                <span>{label}</span>
                <span className="sr-only">{status === "done" ? "— done" : status === "running" ? "— in progress" : status === "failed" ? "— failed" : "— not started"}</span>
              </li>
            );
          })}
        </ol>

        <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 ${outcome.tone === "success" ? "border-green-500/30 bg-green-500/5" : outcome.tone === "warning" ? "border-orange-500/30 bg-orange-500/5" : outcome.tone === "error" ? "border-red-500/30 bg-red-500/5" : "border-gray-200 bg-gray-50 dark:border-gray-700/60 dark:bg-dark-surface"}`}>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            {outcome.headline}
            {phase === "done" && operation.verdict && <VerdictBadge verdict={operation.verdict} />}
          </p>
          {outcome.detail && <p className="mt-1 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{outcome.detail}</p>}
          {operation.error && <p className="mt-1.5 break-words font-mono text-[11px] text-gray-500 dark:text-gray-400">{operation.error}</p>}
        </div>
      </div>

      {phase !== "withdrawing" && phase !== "submitting" && (
        <Actions>
          <button type="button" onClick={onClose} className={SECONDARY}>Close</button>
          {phase === "done" && kind === "replace" && <button type="button" onClick={onViewResults} className={PRIMARY}>View results</button>}
          {phase === "failed" && operation.failedStep === "withdraw" && <button type="button" onClick={kind === "replace" ? onReplace : onWithdraw} className={PRIMARY}>Try again</button>}
          {phase === "failed" && operation.failedStep === "submit" && <button type="button" onClick={onRetrySubmit} className={PRIMARY}>Submit again</button>}
          {phase === "failed" && operation.failedStep === "evaluate" && <Link to={`/assignment/${assignmentId}/submissions`} className={PRIMARY}>Open history</Link>}
        </Actions>
      )}
    </>
  );
}

function operationOutcome(operation: SubmissionOperation, state: SubmissionState): { tone: "neutral" | "success" | "warning" | "error"; headline: string; detail?: string } {
  const { previous, newNumber, kind, phase } = operation;
  if (phase === "withdrawing") return { tone: "neutral", headline: `Withdrawing attempt #${previous.number}…`, detail: "Keep this window open." };
  if (phase === "submitting") return { tone: "neutral", headline: `Submitting attempt #${newNumber}…`, detail: "Keep this window open." };
  if (phase === "evaluating") return { tone: "neutral", headline: `Attempt #${newNumber} is submitted and being evaluated…`, detail: "You can close this window; the result also appears in the header and the Verdict tab." };

  if (phase === "failed") {
    if (operation.failedStep === "withdraw") return { tone: "error", headline: "Nothing changed", detail: `Attempt #${previous.number} could not be withdrawn, so it still counts as your submission.` };
    if (operation.failedStep === "submit") return { tone: "error", headline: "No attempt counts right now", detail: `Attempt #${previous.number} was withdrawn, but attempt #${newNumber} was not sent. Your code is still in the editor — submit it again.` };
    return { tone: "warning", headline: `Attempt #${newNumber} counts, but its result is not ready`, detail: "The evaluation is taking longer than expected. The result will appear in your submission history." };
  }

  if (kind === "withdraw") {
    return { tone: "warning", headline: `Attempt #${previous.number} is withdrawn — no attempt counts right now`, detail: deadlineSentence(state) };
  }
  const tests = operation.totalTests ? `${operation.passedTests ?? 0} of ${operation.totalTests} tests passed. ` : "";
  if (operation.verdict === "AC") {
    return { tone: "success", headline: `Attempt #${newNumber} now counts as your submission`, detail: `${tests}Attempt #${previous.number} is withdrawn and stays in your history.` };
  }
  return {
    tone: "warning",
    headline: `Attempt #${newNumber} now counts as your submission`,
    detail: `${tests}Attempt #${previous.number} (${VERDICT_LABELS[previous.verdict]}) is withdrawn and cannot be restored. ${state.closed ? "" : "You can fix your code and replace this attempt too."}`.trim(),
  };
}
