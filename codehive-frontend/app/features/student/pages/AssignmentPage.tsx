import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { CheckCircle2, Clock, Cpu, History, Scale } from "lucide-react";
import { CodeEditor } from "~/shared/components/CodeEditor";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import {
  AssignmentDetailsPanel,
  type AssignmentDetailsTab,
} from "~/shared/components/AssignmentDetailsPanel";
import {
  AssignmentWorkspace,
  type AssignmentWorkspacePane,
} from "~/shared/components/AssignmentWorkspace";
import { useAuth } from "~/core/providers/AuthProvider";
import { AssistantPanel } from "../components/AssistantPanel";
import { AssistantToggleButton } from "../components/AssistantToggleButton";
import { SubmissionDialog } from "../components/SubmissionDialog";
import { SubmissionStatusButton } from "../components/SubmissionStatusButton";
import { useAssignmentAssistant } from "../hooks/useAssignmentAssistant";
import { useCodeDraft, type DraftStatus } from "../hooks/useCodeDraft";
import { readCodeDraft } from "../utils/code-drafts";
import { describeSubmission, type SubmissionAttempt, type SubmissionOperation, type Verdict } from "../utils/submission-state";
import { getAssignment, listMyAssignmentOverviews } from "../api/assignment.api";
import { listAssignmentSubmissions, withdrawSubmission } from "../api/submission.api";
import type { Assignment, AssignmentGrade, Language } from "../types/assignment.types";
import type { GroupSubmission } from "../types/group-submission.types";
import {
  submitExecution,
  getExecution,
  getExecutionReport,
} from "../api/execution.api";
import type { ExecutionReport, StudentSubmissionHistory, TestCaseResult } from "../types/execution.types";
import {
  ExecutionStatus,
  ExecutionType,
  Language as ExecLanguage,
} from "../types/execution.types";

const LANGUAGE_LABELS: Record<Language, string> = {
  JAVA: "Java",
  PYTHON: "Python",
  CPP: "C++",
  C: "C",
};

const LANGUAGE_VERSIONS: Record<Language, string> = {
  JAVA: "Java 21",
  PYTHON: "python 3.11",
  CPP: "C++ 17",
  C: "C11",
};

const LANGUAGE_FILE: Record<Language, string> = {
  JAVA: "Main.java",
  PYTHON: "solution.py",
  CPP: "solution.cpp",
  C: "solution.c",
};

const MONACO_LANG_MAP: Record<Language, string> = {
  JAVA: "java",
  PYTHON: "python",
  CPP: "cpp",
  C: "c",
};

const LANGUAGE_TEMPLATES: Record<Language, string> = {
  PYTHON: "def main():\n    pass\n\n\nif __name__ == \"__main__\":\n    main()\n",
  JAVA: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n\n        // Write your code here.\n\n        scanner.close();\n    }\n}\n",
  CPP: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n',
  C: '#include <stdio.h>\n\nint main(void) {\n  return 0;\n}\n',
};

const STATUS_DOT: Record<string, string> = {
  AC: "bg-green-400",
  WA: "bg-red-400",
  TLE: "bg-orange-400",
  MLE: "bg-purple-400",
  OLE: "bg-pink-400",
  RTE: "bg-red-400",
  CE: "bg-yellow-400",
  PENDING: "bg-yellow animate-pulse",
};

const VERDICT_STYLES: Record<string, string> = {
  AC: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  WA: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  TLE: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  MLE: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  OLE: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
  RTE: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  CE: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  PENDING: "bg-azure/15 text-azure border-azure/30 animate-pulse",
};

type TestTab = "testcases" | "verdict";

const ASSISTANT_OPEN_KEY = "codehive:assistant-open:v1";

function readAssistantOpen(): boolean {
  try { return window.localStorage.getItem(ASSISTANT_OPEN_KEY) === "true"; }
  catch { return false; }
}

type ExecutionOutcome =
  | { ok: true; status: ExecutionStatus; report: ExecutionReport | null }
  | { ok: false; step: "submit" | "evaluate"; error: string };

type OperationBase = Pick<SubmissionOperation, "kind" | "previous" | "newNumber">;

function formatDeadline(value: string): string {
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Used when the overview request fails, so an attempt that counts is never mistaken for none. */
function currentFromHistory(history: StudentSubmissionHistory[]): GroupSubmission | null {
  const active = history.find((item) => item.submissionStatus === "SUBMITTED");
  return active ? {
    assignmentId: active.assignmentId,
    submissionId: active.submissionId,
    submittedAt: active.submittedAt,
    deliveredLate: active.deliveredLate,
    executionStatus: active.executionStatus as Verdict,
  } : null;
}

function practiceInputs(assignment: Assignment): string[] {
  const samples = [...(assignment.sampleTestCases ?? [])]
    .sort((left, right) => left.order - right.order)
    .map((testCase) => testCase.input);
  return samples.length ? samples : [""];
}

function formatMemory(value?: number): string {
  return value != null && value > 0 ? `${value}MB` : "—";
}

function executionDiagnostic(result?: TestCaseResult): string | null {
  if (!result || ![ExecutionStatus.RTE, ExecutionStatus.MLE, ExecutionStatus.CE].includes(result.status)) return null;
  if (result.stderr?.trim()) return result.stderr.trim();
  if (result.exitCode != null) return `Process exited with code ${result.exitCode} without diagnostic output.`;
  return null;
}

export function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>("PYTHON");
  // One buffer per language, so switching languages never discards work.
  const [codes, setCodes] = useState<Partial<Record<Language, string>>>({});
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const [testCases, setTestCases] = useState<string[]>([""]);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [execError, setExecError] = useState<string | null>(null);
  const [lastExecutionType, setLastExecutionType] = useState<ExecutionType | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<GroupSubmission | null>(null);
  const [history, setHistory] = useState<StudentSubmissionHistory[]>([]);
  const [submissionDialog, setSubmissionDialog] = useState<"overview" | "replace" | null>(null);
  const [operation, setOperation] = useState<SubmissionOperation | null>(null);
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const [returnedGrade, setReturnedGrade] = useState<AssignmentGrade | null>(null);

  const [leftTab, setLeftTab] = useState<AssignmentDetailsTab>("assignment");
  const [testTab, setTestTab] = useState<TestTab>("testcases");
  const [selectedCase, setSelectedCase] = useState(0);
  const [mobilePane, setMobilePane] = useState<AssignmentWorkspacePane>("editor");
  const [assistantOpen, setAssistantOpen] = useState(readAssistantOpen);
  // The conversation loads on first use and then stays mounted while the panel is collapsed.
  const [assistantActivated, setAssistantActivated] = useState(assistantOpen);
  const [assistantFocus, setAssistantFocus] = useState(0);
  const assistantToggle = useRef<HTMLButtonElement>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = user?.id;
  const assistantEnabled = assistantActivated && !!assignment && assignment.id === id;
  const assistant = useAssignmentAssistant(id ?? "", assistantEnabled);
  const draft = useCodeDraft(userId && assignment ? { userId, assignmentId: assignment.id } : null, hasStoredDraft);
  const code = codes[selectedLanguage] ?? LANGUAGE_TEMPLATES[selectedLanguage] ?? "";

  const changeAssistantOpen = useCallback((open: boolean) => {
    setAssistantOpen(open);
    if (open) setAssistantActivated(true);
    try { window.localStorage.setItem(ASSISTANT_OPEN_KEY, String(open)); }
    catch { /* The panel simply starts collapsed next time. */ }
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAssignment(id)
      .then(async (a) => {
        setAssignment(a);
        const [overviews, attempts] = await Promise.allSettled([listMyAssignmentOverviews(), listAssignmentSubmissions(a.id)]);
        const overview = overviews.status === "fulfilled" ? overviews.value.find((item) => item.assignment.id === a.id) : undefined;
        const loaded = attempts.status === "fulfilled" ? attempts.value : [];
        setHistory(loaded);
        setCurrentSubmission(overview ? overview.currentSubmission ?? null : currentFromHistory(loaded));
        setReturnedGrade(overview?.grade ?? null);
        setTestCases(practiceInputs(a));
        setSelectedCase(0);
        const allowed = a.allowedLanguages ?? [];
        const stored = userId ? readCodeDraft(userId, a.id) : null;
        setHasStoredDraft(stored !== null);
        setCodes(stored?.code ?? {});
        if (stored && allowed.includes(stored.language)) setSelectedLanguage(stored.language);
        else if (allowed.length > 0) setSelectedLanguage(allowed[0]);
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          const mock: Assignment = {
            id: "preview",
            groupId: "preview-group",
            title: "Two Sum",
            description:
              "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
            constraints: [
              "2 ≤ nums.length ≤ 10⁴",
              "-10⁹ ≤ nums[i] ≤ 10⁹",
              "-10⁹ ≤ target ≤ 10⁹",
              "Only one valid answer exists.",
            ],
            hints: [
              "A brute-force approach is O(n²). Can you do better?",
              "Consider using a hash map to store complements.",
            ],
            tags: ["array", "hash-table"],
            examples: [{
              input: "nums = [2, 7, 11, 15]\ntarget = 9",
              output: "[0, 1]",
              explanation: "nums[0] + nums[1] equals target.",
            }],
            sampleTestCases: [{
              order: 1,
              input: "4\n2 7 11 15\n9\n",
            }],
            timeLimitMs: 1000,
      memoryLimitMb: 256,
      maxPoints: 100,
            comparatorType: "EXACT_MATCH",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            allowedLanguages: ["PYTHON", "JAVA", "CPP", "C"],
            isActive: true,
          };
          setAssignment(mock);
          setHistory([]);
          setCurrentSubmission(null);
          setReturnedGrade(null);
          setTestCases(practiceInputs(mock));
          setSelectedCase(0);
          setHasStoredDraft(false);
          setCodes({});
          setSelectedLanguage(mock.allowedLanguages[0]);
        } else {
          setError("Assignment not found.");
        }
      })
      .finally(() => setLoading(false));
  }, [id, userId]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function handleLanguageChange(lang: Language) {
    setSelectedLanguage(lang);
    draft.schedule({ language: lang, code: codes });
  }

  function handleCodeChange(value: string) {
    const next = { ...codes, [selectedLanguage]: value };
    setCodes(next);
    draft.schedule({ language: selectedLanguage, code: next });
  }

  function toggleAssistant() {
    const open = !assistantOpen;
    changeAssistantOpen(open);
    if (open) setAssistantFocus((value) => value + 1);
  }

  function collapseAssistant() {
    changeAssistantOpen(false);
    assistantToggle.current?.focus();
  }

  function changeMobilePane(pane: AssignmentWorkspacePane) {
    if (pane === "side") setAssistantActivated(true);
    setMobilePane(pane);
  }

  async function runExecution(
    type: ExecutionType,
    // announce: false leaves the outcome to the caller instead of the accepted modal.
    options: { announce?: boolean; onSubmitted?: () => void } = {},
  ): Promise<ExecutionOutcome> {
    if (!assignment || !code.trim()) return { ok: false, step: "submit", error: "Your editor is empty." };
    const isSub = type === ExecutionType.DEFINITIVE;
    setLastExecutionType(type);
    if (isSub) setIsSubmitting(true); else setIsRunning(true);
    setReport(null);
    setExecError(null);
    setShowAcceptedModal(false);

    let submitted = false;
    try {
      const dto = await submitExecution({
        code,
        language: selectedLanguage as unknown as ExecLanguage,
        requesterId: user?.id,
        assignmentId: assignment.id,
        testCases: type === ExecutionType.PRACTICE
          ? testCases.filter((tc) => tc.trim().length > 0)
          : undefined,
        executionType: type,
      });

      submitted = true;
      if (isSub && dto.submissionId) {
        setCurrentSubmission({
          assignmentId: assignment.id,
          submissionId: dto.submissionId,
          submittedAt: dto.createdAt ?? new Date().toISOString(),
          deliveredLate: !!assignment.dueDate && Date.now() > Date.parse(assignment.dueDate),
          executionStatus: "PENDING",
        });
        // A new submission clears any returned grade on the server.
        setReturnedGrade(null);
      }
      options.onSubmitted?.();

      let attempts = 0;
      return await new Promise<ExecutionOutcome>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          attempts++;
          try {
            const updated = await getExecution(dto.id);
            if (updated.status !== ExecutionStatus.PENDING) {
              clearInterval(pollRef.current!);
              if (isSub && dto.submissionId) {
                setCurrentSubmission((current) => current && current.submissionId === dto.submissionId
                  ? { ...current, executionStatus: updated.status as GroupSubmission["executionStatus"] }
                  : current);
              }
              let finished: ExecutionReport | null = null;
              try { finished = await getExecutionReport(dto.id); setReport(finished); } catch { /* CE */ }
              if (isSub && updated.status === ExecutionStatus.AC && options.announce !== false) setShowAcceptedModal(true);
              resolve({ ok: true, status: updated.status, report: finished });
            } else if (attempts >= 40) {
              clearInterval(pollRef.current!);
              reject(new Error("Execution timed out. Please try again."));
            }
          } catch (e) { clearInterval(pollRef.current!); reject(e); }
        }, 1500);
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Execution failed.";
      setExecError(message);
      return { ok: false, step: submitted ? "evaluate" : "submit", error: message };
    } finally {
      if (isSub) setIsSubmitting(false); else setIsRunning(false);
      setTestTab("verdict");
      if (isSub) void refreshHistory();
    }
  }

  function addTestCase() { setTestCases((p) => [...p, ""]); }
  function removeTestCase(i: number) { setTestCases((p) => p.filter((_, idx) => idx !== i)); }
  function updateTestCase(i: number, v: string) { setTestCases((p) => p.map((tc, idx) => idx === i ? v : tc)); }

  async function refreshHistory() {
    if (!id) return;
    try { setHistory(await listAssignmentSubmissions(id)); }
    catch { /* The attempts already loaded stay on screen. */ }
  }

  function closeSubmissionDialog() {
    setSubmissionDialog(null);
    setOperation(null);
  }

  async function withdrawAttempt(kind: SubmissionOperation["kind"], previous: SubmissionAttempt, newNumber: number) {
    const base: OperationBase = { kind, previous, newNumber };
    setOperation({ ...base, phase: "withdrawing" });
    try {
      await withdrawSubmission(previous.submissionId);
    } catch (cause) {
      setOperation({ ...base, phase: "failed", failedStep: "withdraw", error: cause instanceof Error ? cause.message : "Could not withdraw the submission." });
      return;
    }
    const withdrawnAt = new Date().toISOString();
    setHistory((items) => items.map((item) => item.submissionId === previous.submissionId ? { ...item, submissionStatus: "WITHDRAWN", withdrawnAt } : item));
    setCurrentSubmission(null);
    if (kind === "replace") {
      await submitReplacement(base);
    } else {
      setOperation({ ...base, phase: "done" });
      void refreshHistory();
    }
  }

  async function submitReplacement(base: OperationBase) {
    setOperation({ ...base, phase: "submitting" });
    // The student may close the dialog while the evaluation runs; a closed dialog keeps no operation.
    const outcome = await runExecution(ExecutionType.DEFINITIVE, {
      announce: false,
      onSubmitted: () => setOperation((active) => active && { ...base, phase: "evaluating" }),
    });
    setOperation((active) => active && (outcome.ok
      ? { ...base, phase: "done", verdict: outcome.status as Verdict, passedTests: outcome.report?.passedTests, totalTests: outcome.report?.totalTests }
      : { ...base, phase: "failed", failedStep: outcome.step, error: outcome.error }));
  }

  const allowedLangs = assignment?.allowedLanguages ?? (["PYTHON"] as Language[]);

  if (loading) return <LoadingScreen />;
  if (error || !assignment) return <ErrorScreen message={error ?? "Assignment not found."} />;

  const filename = LANGUAGE_FILE[selectedLanguage];
  const langVersion = LANGUAGE_VERSIONS[selectedLanguage];
  const comparatorLabel = assignment.comparatorType === "EXACT_MATCH" ? "exact match" : "float match";

  const now = new Date();
  const isPastClose = !!assignment.closeDate && new Date(assignment.closeDate) < now;
  const isBeforeLaunch = !!assignment.launchDate && new Date(assignment.launchDate) > now;
  const isNotReady = !!assignment.validationStatus && assignment.validationStatus !== "READY";
  const submission = describeSubmission({ assignment, history, current: currentSubmission, grade: returnedGrade, now: now.getTime() });
  const canSubmit = !isPastClose && !isBeforeLaunch && !isNotReady && submission.phase !== "evaluating";
  const canRun = !isBeforeLaunch && !isNotReady;

  // Reasons that depend on the assignment itself; they keep the banner below the header.
  const assignmentNotice = isBeforeLaunch
    ? "This assignment hasn't opened yet."
    : isNotReady
    ? "Assignment is still being processed. Try again shortly."
    : isPastClose
    ? "This assignment is closed — no further submissions."
    : null;
  const submitBlockReason = assignmentNotice
    ?? (submission.phase === "evaluating" ? "Submission is being evaluated. Results will appear shortly." : null);
  // Having withdrawn without resubmitting is the one submission state that risks delivering nothing.
  const withdrawnAttempt = !assignmentNotice && submission.phase === "withdrawn" ? submission.previous[0] : null;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans overflow-hidden">

      {/* ── Header ── */}
      <header className="h-12 flex-shrink-0 flex items-center gap-3 px-3 border-b border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface z-20">
        {/* Back */}
        <Link
          to="/dashboard"
          className="flex-shrink-0 flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-medium hidden sm:block">Back</span>
        </Link>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 flex-shrink-0" />

        {/* Title + tags */}
        <div className="hidden sm:flex items-center gap-2 min-w-0 flex-shrink-0 max-w-[240px]">
          <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" className="flex-shrink-0 text-azure">
              <polygon points="5,0 9.33,2.5 9.33,7.5 5,10 0.67,7.5 0.67,2.5" />
            </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{assignment.title}</span>
          {assignment.tags?.slice(0, 1).map((tag) => (
            <span key={tag} className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700/60 flex-shrink-0">
              {tag}
            </span>
          ))}
        </div>

        {/* Center: metrics */}
        <div className="hidden md:flex lg:hidden xl:flex flex-1 items-center justify-center gap-4">
          <MetricChip icon={<Clock className="w-3 h-3" />} label={`${assignment.timeLimitMs}ms`} />
          <MetricChip icon={<Cpu className="w-3 h-3" />} label={`${assignment.memoryLimitMb}MB`} />
          <MetricChip icon={<Scale className="w-3 h-3" />} label={comparatorLabel} />
        </div>

        {/* Right: language + actions */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link
            to={`/assignment/${assignment.id}/submissions`}
            title="Submission history"
            aria-label="Submission history"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-azure hover:text-azure dark:hover:border-gray-400 dark:hover:text-gray-100 transition-all"
          >
            <History size={14} />
            <span className="hidden xl:inline">History</span>
          </Link>
          <Link
            to={`/grades?assignmentId=${assignment.id}`}
            title={returnedGrade ? "View returned grade" : "View grade status"}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-azure hover:text-azure dark:hover:border-yellow dark:hover:text-yellow transition-all"
          >
            <Scale size={14} />
            <span className="hidden xl:inline">{returnedGrade ? `${returnedGrade.value}/${returnedGrade.maxPoints} pts` : `${assignment.maxPoints} pts`}</span>
          </Link>
          <SubmissionStatusButton state={submission} onOpen={() => setSubmissionDialog("overview")} />
          {user && <AssistantToggleButton ref={assistantToggle} open={assistantOpen} busy={assistant.sending} onToggle={toggleAssistant} />}
          <Dropdown value={selectedLanguage} onChange={(value) => handleLanguageChange(value as Language)} size="compact" className="w-28 font-mono" ariaLabel="Programming language" options={allowedLangs.map((language) => ({ value: language, label: LANGUAGE_LABELS[language] }))} />

          <button
            onClick={() => runExecution(ExecutionType.PRACTICE)}
            disabled={isRunning || isSubmitting || !canRun}
            title={!canRun ? (submitBlockReason ?? undefined) : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-azure hover:text-azure dark:hover:border-gray-400 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            <span className="hidden sm:inline">Run sample</span>
          </button>

          <button
            onClick={() => (submission.phase === "active" ? setSubmissionDialog("replace") : void runExecution(ExecutionType.DEFINITIVE))}
            disabled={isRunning || isSubmitting || !canSubmit}
            aria-haspopup={submission.phase === "active" ? "dialog" : undefined}
            aria-label={submission.phase === "active" ? "Resubmit" : "Submit"}
            title={!canSubmit ? (submitBlockReason ?? undefined) : submission.phase === "active" ? `Replace attempt #${submission.current?.number} with the code in your editor` : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-azure hover:bg-french disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
          >
            {isSubmitting ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : null}
            <span className="hidden sm:inline">{submission.phase === "active" ? "Resubmit" : "Submit"}</span>
            {/* Below sm the label is hidden, so the arrow is what identifies the button. */}
            {!isSubmitting && (
              <svg className="sm:hidden w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-6 6m6-6l6 6" />
              </svg>
            )}
            <svg className="hidden sm:block w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Status banner ── */}
      {assignmentNotice && (
        <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-medium ${
          isPastClose
            ? "bg-red-500/10 text-red-400 border-b border-red-500/20"
            : isBeforeLaunch
            ? "bg-gray-500/10 text-gray-400 border-b border-gray-500/20"
            : "bg-orange-500/10 text-orange-400 border-b border-orange-500/20"
        }`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {assignmentNotice}
        </div>
      )}
      {withdrawnAttempt && (
        <div className="flex-shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs font-medium bg-orange-500/10 text-orange-700 dark:text-orange-400 border-b border-orange-500/20">
          <span className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No attempt counts right now: attempt #{withdrawnAttempt.number} was withdrawn. Submit a new version{assignment.closeDate ? ` before ${formatDeadline(assignment.closeDate)}` : ""} to deliver this assignment.
          </span>
          <button type="button" onClick={() => setSubmissionDialog("overview")} className="rounded font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Details</button>
        </div>
      )}

      <AssignmentWorkspace
        persistenceKey="codehive-student-assignment"
        mobilePane={mobilePane}
        onMobilePaneChange={changeMobilePane}
        sideLabel="Assistant"
        sideOpen={assistantOpen}
        onSideOpenChange={changeAssistantOpen}
        sidePane={user ? (
          <div id="assignment-assistant" className="h-full min-h-0">
            {assistantActivated && (
              <AssistantPanel
                assistant={assistant}
                assignmentId={assignment.id}
                groupId={assignment.groupId}
                userId={user.id}
                language={selectedLanguage}
                code={code}
                focusSignal={assistantFocus}
                onCollapse={collapseAssistant}
              />
            )}
          </div>
        ) : undefined}
        assignmentPane={(
          <AssignmentDetailsPanel
            assignment={assignment}
            tab={leftTab}
            onTabChange={setLeftTab}
            note={(
              <div>
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow">Grading notes</p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  Practice mode compares your output against teacher reference solution. Run samples before submitting.
                </p>
              </div>
            )}
          />
        )}
        editorPane={(
          <StudentEditorPane
            filename={filename}
            language={MONACO_LANG_MAP[selectedLanguage]}
            languageVersion={langVersion}
            value={code}
            onChange={handleCodeChange}
            draftStatus={draft.status}
          />
        )}
        testsPane={(
          <StudentTestsPane
            assignment={assignment}
            testCases={testCases}
            selectedCase={selectedCase}
            testTab={testTab}
            report={report}
            lastExecutionType={lastExecutionType}
            execError={execError}
            onSelectCase={setSelectedCase}
            onTabChange={setTestTab}
            onAdd={addTestCase}
            onUpdate={updateTestCase}
            onRemove={removeTestCase}
          />
        )}
      />

      {submissionDialog && (
        <SubmissionDialog
          assignmentId={assignment.id}
          assignmentTitle={assignment.title}
          state={submission}
          initialView={submissionDialog}
          operation={operation}
          editor={{ language: LANGUAGE_LABELS[selectedLanguage], lines: code.split("\n").length, empty: !code.trim() }}
          canSubmitNew={canSubmit && !isRunning && !isSubmitting}
          submitBlockReason={submitBlockReason}
          onClose={closeSubmissionDialog}
          onReplace={() => { if (submission.current) void withdrawAttempt("replace", submission.current, submission.nextNumber); }}
          onWithdraw={() => { if (submission.current) void withdrawAttempt("withdraw", submission.current, submission.nextNumber); }}
          onRetrySubmit={() => { if (operation) void submitReplacement({ kind: operation.kind, previous: operation.previous, newNumber: operation.newNumber }); }}
          onSubmitNew={() => { closeSubmissionDialog(); void runExecution(ExecutionType.DEFINITIVE); }}
          onViewResults={() => { closeSubmissionDialog(); setTestTab("verdict"); setMobilePane("tests"); }}
        />
      )}

      {showAcceptedModal && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-dark-bg/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="submission-accepted-title">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 grid place-items-center"><CheckCircle2 size={25} /></div>
            <h2 id="submission-accepted-title" className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Submission accepted</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">All tests passed. Your current version is saved and available in submission history.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end"><button onClick={() => setShowAcceptedModal(false)} className="btn-outline">Keep working</button><Link to="/assignments" className="btn-outline text-center">My assignments</Link><Link to={`/assignment/${assignment.id}/submissions`} className="btn-primary text-center">View history</Link></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Left panel tab contents ── */

function ProblemTab({ assignment }: { assignment: Assignment }) {
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <div className="space-y-4">
      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        {assignment.isActive && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
            <span className="w-1 h-1 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
            Active
          </span>
        )}
        {assignment.dueDate && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
            isOverdue
              ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
          }`}>
            Due {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Tags */}
      {assignment.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assignment.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              {tag}
            </span>
          )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`dot-${i}`} className="text-gray-300 dark:text-gray-700">·</span>, el], [] as React.ReactNode[])}
        </div>
      )}

      {/* Title */}
      <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">{assignment.title}</h1>

      {/* Description */}
      {assignment.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
          {assignment.description}
        </p>
      )}

      {/* Examples */}
      {assignment.examples && assignment.examples.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Examples
          </p>
          {assignment.examples.map((ex, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Example {i + 1}
              </p>
              <div className="rounded-lg bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 px-3 py-2.5 space-y-1 font-mono text-[11px]">
                <div>
                  <span className="text-gray-500 dark:text-gray-500">input: </span>
                  <span className="text-gray-800 dark:text-gray-300">{ex.input}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-500">output: </span>
                  <span className="text-gray-800 dark:text-gray-300">{ex.output}</span>
                </div>
                {ex.explanation && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 font-sans leading-relaxed pt-1 border-t border-gray-200 dark:border-gray-800/60 mt-1">
                    {ex.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grading notes */}
      <div className="rounded-lg border border-yellow/30 bg-yellow/5 dark:bg-yellow/5 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow text-xs font-semibold">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Grading notes
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          Practice mode compares your output against the teacher's reference solution. Run sample to test before submitting.
        </p>
      </div>
    </div>
  );
}

function ConstraintsTab({ assignment }: { assignment: Assignment }) {
  if (!assignment.constraints?.length) {
    return <EmptyState label="No constraints defined." />;
  }
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Constraints</p>
      <ul className="space-y-2">
        {assignment.constraints.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-azure dark:bg-yellow flex-shrink-0" />
            <span className="font-mono">{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HintsTab({ assignment }: { assignment: Assignment }) {
  if (!assignment.hints?.length) {
    return <EmptyState label="No hints available." />;
  }
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Hints</p>
      <ul className="space-y-3">
        {assignment.hints.map((h, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="text-azure dark:text-yellow font-bold font-mono flex-shrink-0">{i + 1}.</span>
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Test panel contents ── */

function StudentEditorPane({
  filename,
  language,
  languageVersion,
  value,
  onChange,
  draftStatus,
}: {
  filename: string;
  language: string;
  languageVersion: string;
  value: string;
  onChange: (value: string) => void;
  draftStatus: DraftStatus;
}) {
  return (
    <section className="h-full min-h-0 flex flex-col overflow-hidden bg-white dark:bg-dark-card">
      <div className="h-9 flex-shrink-0 flex items-center border-b border-gray-200 dark:border-gray-800/60 bg-gray-100 dark:bg-dark-surface">
        <div className="flex items-center gap-2 px-4 h-full border-r border-gray-200 dark:border-gray-800/60 border-t-2 border-t-azure dark:border-t-yellow bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-azure dark:bg-yellow" />
          {filename}
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-3 px-4 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
          <span>UTF-8</span><span>LF</span><span>Spaces: 4</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <CodeEditor language={language} value={value} onChange={onChange} />
      </div>
      <div className="h-6 flex-shrink-0 flex items-center justify-between px-3 bg-gray-50 dark:bg-dark-surface border-t border-gray-200 dark:border-gray-800/60 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
        <DraftIndicator status={draftStatus} />
        <div className="flex items-center gap-4"><span>{languageVersion}</span><span>{value.split("\n").length} lines</span></div>
      </div>
    </section>
  );
}

function DraftIndicator({ status }: { status: DraftStatus }) {
  if (status === "error") {
    return <span role="alert" className="flex items-center gap-1 text-orange-600 dark:text-orange-400" title="This browser blocked or filled its storage. Keep this tab open and copy your code before leaving."><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Not saved in this browser</span>;
  }
  const label = status === "saving" ? "Saving…" : status === "saved" ? "Draft saved in this browser" : "Draft autosaves in this browser";
  return <span className="flex items-center gap-1" title="Your draft is kept in this browser for this assignment. Submit to store it on CodeHive."><span className={`w-1.5 h-1.5 rounded-full ${status === "saved" ? "bg-green-500" : "bg-gray-400"}`} />{label}</span>;
}

function StudentTestsPane({
  assignment,
  testCases,
  selectedCase,
  testTab,
  report,
  lastExecutionType,
  execError,
  onSelectCase,
  onTabChange,
  onAdd,
  onUpdate,
  onRemove,
}: {
  assignment: Assignment;
  testCases: string[];
  selectedCase: number;
  testTab: TestTab;
  report: ExecutionReport | null;
  lastExecutionType: ExecutionType | null;
  execError: string | null;
  onSelectCase: (index: number) => void;
  onTabChange: (tab: TestTab) => void;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="h-full min-h-0 flex flex-col overflow-hidden bg-white dark:bg-dark-surface">
      <div className="flex-shrink-0 flex items-center border-b border-gray-200 dark:border-gray-800/60 px-2">
        <div className="flex">
          {(["testcases", "verdict"] as TestTab[]).map((item) => (
            <button key={item} onClick={() => onTabChange(item)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${testTab === item ? "border-azure text-azure dark:border-yellow dark:text-yellow" : "border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"}`}>
              {item === "testcases" ? "Test cases" : "Verdict"}
            </button>
          ))}
        </div>
        {testTab === "testcases" && (
          <div className="flex items-center gap-1.5 ml-3 overflow-x-auto flex-1 py-1.5">
            {testCases.map((_, index) => {
              const result = lastExecutionType === ExecutionType.PRACTICE ? report?.testCaseResults?.[index] : undefined;
              return (
                <button key={index} onClick={() => onSelectCase(index)} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium flex-shrink-0 border transition-colors ${selectedCase === index ? "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-700/60 dark:border-gray-600 dark:text-gray-200" : "border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${result ? (STATUS_DOT[result.status] ?? "bg-gray-400") : "bg-gray-300 dark:bg-gray-600"}`} />
                  {String(index + 1).padStart(2, "0")}
                </button>
              );
            })}
            <button onClick={onAdd} className="flex-shrink-0 rounded border border-transparent px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:border-gray-700 dark:hover:text-gray-400">+ case</button>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {testTab === "testcases" ? (
          <TestCasesContent testCases={testCases} selectedCase={selectedCase} report={report} showPracticeDiagnostics={lastExecutionType === ExecutionType.PRACTICE} execError={execError} onUpdate={onUpdate} onRemove={onRemove} />
        ) : (
          <VerdictContent report={report} execError={execError} />
        )}
      </div>
      {report && <ResultsStatusBar report={report} timeLimitMs={assignment.timeLimitMs} memoryLimitMb={assignment.memoryLimitMb} />}
    </section>
  );
}

function TestCasesContent({
  testCases,
  selectedCase,
  report,
  showPracticeDiagnostics,
  execError,
  onUpdate,
  onRemove,
}: {
  testCases: string[];
  selectedCase: number;
  report: ExecutionReport | null;
  showPracticeDiagnostics: boolean;
  execError: string | null;
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const tc = testCases[selectedCase] ?? "";
  const result = showPracticeDiagnostics ? report?.testCaseResults?.[selectedCase] : undefined;
  const hasResult = !!result;
  const hasPracticeOutputs = result?.expectedOutput !== undefined || result?.actualOutput !== undefined;

  return (
    <div className="h-full flex flex-col">
      {execError && (
        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border-b border-red-500/20 flex-shrink-0">
          {execError}
        </div>
      )}
      {report?.compilationError && (
        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-300 bg-red-500/10 border-b border-red-500/20 font-mono whitespace-pre-wrap flex-shrink-0">
          {report.compilationError}
        </div>
      )}

      {hasResult ? (
        <div className="flex flex-1 min-h-0 divide-x divide-gray-200 dark:divide-gray-800/60">
          <Column label="INPUT" headerRight={
            testCases.length > 1 ? (
              <button onClick={() => onRemove(selectedCase)} className="text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null
          }>
            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 p-3 whitespace-pre-wrap">{tc || "—"}</pre>
          </Column>

          {hasPracticeOutputs ? (
            <>
              <Column label="EXPECTED" headerRight={<span className="text-[10px] text-gray-400 dark:text-gray-600">reference solution</span>}>
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 p-3 whitespace-pre-wrap">
                  {result.expectedOutput ?? "Expected output unavailable"}
                </pre>
              </Column>
              <Column
                label="YOUR OUTPUT"
                headerRight={<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${VERDICT_STYLES[result.status] ?? ""}`}>{result.status}</span>}
              >
                <div className="p-3 space-y-2">
                  <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.actualOutput ?? "No output captured"}</pre>
                  {result.executionTimeMs !== undefined && <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{result.executionTimeMs}ms · {formatMemory(result.memoryUsedMb)}</p>}
                  <ExecutionDiagnostic result={result} />
                </div>
              </Column>
            </>
          ) : (
            <Column label="RESULT" headerRight={<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${VERDICT_STYLES[result.status] ?? ""}`}>{result.status}</span>}>
              <div className="p-3 space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-300">{result.feedback ?? "Execution completed."}</p>
                {result.executionTimeMs !== undefined && <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{result.executionTimeMs}ms · {formatMemory(result.memoryUsedMb)}</p>}
                <ExecutionDiagnostic result={result} />
              </div>
            </Column>
          )}
        </div>
      ) : (
        /* Input-only edit view */
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800/60 flex-shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Input</span>
              {testCases.length > 1 && (
                <button onClick={() => onRemove(selectedCase)} className="text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <textarea
              value={tc}
              onChange={(e) => onUpdate(selectedCase, e.target.value)}
              placeholder="Type input here…"
              className="flex-1 w-full resize-none bg-transparent text-xs font-mono text-gray-700 dark:text-gray-300 p-3 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-700"
            />
          </div>
        </div>
      )}

    </div>
  );
}

function Column({
  label,
  headerRight,
  children,
}: {
  label: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800/60 flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">{label}</span>
        {headerRight}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function VerdictContent({ report, execError }: { report: ExecutionReport | null; execError: string | null }) {
  if (execError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
        <span className="text-red-600 dark:text-red-400 text-sm font-medium">Execution Error</span>
        <p className="text-xs text-gray-500">{execError}</p>
      </div>
    );
  }
  if (!report) return <EmptyState label="Submit your code to see the verdict." />;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className={`px-2.5 py-1 rounded border text-xs font-bold ${VERDICT_STYLES[report.overallStatus] ?? ""}`}>
          {report.overallStatus}
        </span>
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          {report.passedTests} / {report.totalTests} test cases passed
        </span>
      </div>
      {report.compilationError && (
        <pre className="text-xs font-mono text-red-700 dark:text-red-300 bg-red-500/10 rounded p-2 whitespace-pre-wrap border border-red-500/20">
          {report.compilationError}
        </pre>
      )}
      <div className="space-y-1.5">
        {report.testCaseResults?.map((r, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800/60 px-2.5 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[r.status] ?? "bg-gray-400"}`} />
              <span className="text-gray-400 dark:text-gray-500 font-mono w-12">Case {i + 1}</span>
              <span className={`font-medium ${r.status === "AC" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{r.status}</span>
              <span className="text-gray-400 dark:text-gray-600 ml-auto font-mono">
                {r.executionTimeMs == null ? "—" : `${r.executionTimeMs}ms`} · {formatMemory(r.memoryUsedMb)}
              </span>
            </div>
            <ExecutionDiagnostic result={r} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsStatusBar({
  report,
  timeLimitMs,
  memoryLimitMb,
}: {
  report: ExecutionReport;
  timeLimitMs: number;
  memoryLimitMb: number;
}) {
  const pct = report.totalTests > 0 ? (report.passedTests / report.totalTests) * 100 : 0;
  const allPassed = report.passedTests === report.totalTests;

  return (
    <div className="h-8 flex-shrink-0 flex items-center gap-3 px-3 border-t border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-bg">
      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold flex-shrink-0 ${VERDICT_STYLES[report.overallStatus] ?? ""}`}>
        {report.overallStatus}
      </span>

      <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
        {report.passedTests}/{report.totalTests} cases passed
      </span>

      {/* Progress bar */}
      <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${allPassed ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-600 font-mono flex-shrink-0">
        {report.maxExecutionTimeMs !== undefined && (
          <span>time {report.maxExecutionTimeMs}ms/{timeLimitMs}ms</span>
        )}
        {report.maxMemoryUsedMb != null && report.maxMemoryUsedMb > 0 && (
          <span>mem {report.maxMemoryUsedMb.toFixed(1)}MB/{memoryLimitMb}MB</span>
        )}
      </div>
    </div>
  );
}

function ExecutionDiagnostic({ result }: { result: TestCaseResult }) {
  const diagnostic = executionDiagnostic(result);
  if (!diagnostic) return null;
  return (
    <details className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-2">
      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
        {result.status === ExecutionStatus.MLE ? "Memory diagnostic" : "Runtime diagnostic"}
      </summary>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] font-mono text-red-700 dark:text-red-300">{diagnostic}</pre>
    </details>
  );
}

/* ── Shared small components ── */

function MetricChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-500 font-mono">
      <span className="text-gray-400 dark:text-gray-600">{icon}</span>
      {label}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-gray-600 text-center px-4">
      {label}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-dark-bg">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-azure to-french mb-4">
          <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Loading assignment…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-dark-bg">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">Assignment not found</h1>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-azure text-white text-sm font-medium hover:bg-french transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
