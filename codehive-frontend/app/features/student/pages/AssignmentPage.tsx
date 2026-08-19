import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Clock, Cpu, Scale } from "lucide-react";
import { CodeEditor } from "~/shared/components/CodeEditor";
import { useAuth } from "~/core/providers/AuthProvider";
import { getAssignment } from "../api/assignment.api";
import type { Assignment, Language } from "../types/assignment.types";
import {
  submitExecution,
  getExecution,
  getExecutionReport,
} from "../api/execution.api";
import type { ExecutionReport, TestCaseResult } from "../types/execution.types";
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
  PYTHON: "def solution():\n    pass\n",
  JAVA: "class Solution {\n\n}\n",
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

type LeftTab = "problem" | "constraints" | "hints" | "mysubs";
type TestTab = "testcases" | "output" | "stderr" | "verdict";
type AiMessage = { role: "user" | "ai"; text: string };

function practiceInputs(assignment: Assignment): string[] {
  const samples = [...(assignment.sampleTestCases ?? [])]
    .sort((left, right) => left.order - right.order)
    .map((testCase) => testCase.input);
  return samples.length ? samples : [""];
}

export function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>("PYTHON");
  const [code, setCode] = useState(LANGUAGE_TEMPLATES["PYTHON"]);
  const [testCases, setTestCases] = useState<string[]>([""]);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  const [leftTab, setLeftTab] = useState<LeftTab>("problem");
  const [testTab, setTestTab] = useState<TestTab>("testcases");
  const [selectedCase, setSelectedCase] = useState(0);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAssignment(id)
      .then((a) => {
        setAssignment(a);
        setTestCases(practiceInputs(a));
        setSelectedCase(0);
        if (a.allowedLanguages?.length > 0) {
          setSelectedLanguage(a.allowedLanguages[0]);
          setCode(LANGUAGE_TEMPLATES[a.allowedLanguages[0]] ?? "");
        }
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          const mock: Assignment = {
            id: "preview",
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
            comparatorType: "EXACT_MATCH",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            allowedLanguages: ["PYTHON", "JAVA", "CPP", "C"],
            isActive: true,
          };
          setAssignment(mock);
          setTestCases(practiceInputs(mock));
          setSelectedCase(0);
          setSelectedLanguage(mock.allowedLanguages[0]);
          setCode(LANGUAGE_TEMPLATES[mock.allowedLanguages[0]] ?? "");
        } else {
          setError("Assignment not found.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function handleLanguageChange(lang: Language) {
    setSelectedLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang] ?? "");
  }

  async function runExecution(type: ExecutionType) {
    if (!assignment || !code.trim()) return;
    const isSub = type === ExecutionType.DEFINITIVE;
    if (isSub) setIsSubmitting(true); else setIsRunning(true);
    setReport(null);
    setExecError(null);

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

      let attempts = 0;
      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          attempts++;
          try {
            const updated = await getExecution(dto.id);
            if (updated.status !== ExecutionStatus.PENDING) {
              clearInterval(pollRef.current!);
              try { setReport(await getExecutionReport(dto.id)); } catch { /* CE */ }
              resolve();
            } else if (attempts >= 40) {
              clearInterval(pollRef.current!);
              reject(new Error("Execution timed out. Please try again."));
            }
          } catch (e) { clearInterval(pollRef.current!); reject(e); }
        }, 1500);
      });
    } catch (e: unknown) {
      setExecError(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      if (isSub) setIsSubmitting(false); else setIsRunning(false);
      setTestTab("verdict");
    }
  }

  function addTestCase() { setTestCases((p) => [...p, ""]); }
  function removeTestCase(i: number) { setTestCases((p) => p.filter((_, idx) => idx !== i)); }
  function updateTestCase(i: number, v: string) { setTestCases((p) => p.map((tc, idx) => idx === i ? v : tc)); }

  function sendAiMessage() {
    if (!aiInput.trim()) return;
    setAiMessages((p) => [...p, { role: "user", text: aiInput.trim() }]);
    setAiInput("");
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
  const canSubmit = !isPastClose && !isBeforeLaunch && !isNotReady;
  const canRun = !isBeforeLaunch && !isNotReady;

  const submitBlockReason = isBeforeLaunch
    ? "This assignment hasn't opened yet."
    : isNotReady
    ? "Assignment is still being processed. Try again shortly."
    : isPastClose
    ? "This assignment is closed — no further submissions."
    : null;

  const LEFT_TABS: { id: LeftTab; label: string }[] = [
    { id: "problem", label: "Problem" },
    { id: "constraints", label: "Constraints" },
    { id: "hints", label: "Hints" },
    { id: "mysubs", label: "My subs" },
  ];

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
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0 max-w-[240px]">
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
        <div className="flex-1 flex items-center justify-center gap-4">
          <MetricChip icon={<Clock className="w-3 h-3" />} label={`${assignment.timeLimitMs}ms`} />
          <MetricChip icon={<Cpu className="w-3 h-3" />} label={`${assignment.memoryLimitMb}MB`} />
          <MetricChip icon={<Scale className="w-3 h-3" />} label={comparatorLabel} />
        </div>

        {/* Right: language + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 focus:outline-none focus:border-azure transition-colors font-mono"
          >
            {allowedLangs.map((lang) => (
              <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>
            ))}
          </select>

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
            Run sample
          </button>

          <button
            onClick={() => runExecution(ExecutionType.DEFINITIVE)}
            disabled={isRunning || isSubmitting || !canSubmit}
            title={!canSubmit ? (submitBlockReason ?? undefined) : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-azure hover:bg-french disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
          >
            {isSubmitting ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : null}
            Submit
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Status banner ── */}
      {submitBlockReason && (
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
          {submitBlockReason}
        </div>
      )}

      {/* ── Mobile tabs ── */}
      <div className="lg:hidden flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface">
        {(["problem", "editor", "tests"] as const).map((t) => (
          <MobileTab key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={false} onClick={() => {}} />
        ))}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left panel: Problem ── */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-gray-800/60 min-h-0">
          {/* Left tabs */}
          <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800/60">
            {LEFT_TABS.map(({ id: tab, label }) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-2.5 text-[10px] font-medium whitespace-nowrap transition-colors border-b-2 ${
                  leftTab === tab
                    ? "border-azure text-azure dark:border-yellow dark:text-yellow"
                    : "border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Left content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
            {leftTab === "problem" && <ProblemTab assignment={assignment} />}
            {leftTab === "constraints" && <ConstraintsTab assignment={assignment} />}
            {leftTab === "hints" && <HintsTab assignment={assignment} />}
            {leftTab === "mysubs" && <MySubsTab />}
          </div>
        </div>

        {/* ── Right: Editor + Tests ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* ── Editor ── */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

            {/* File tab bar */}
            <div className="h-9 flex-shrink-0 flex items-center border-b border-gray-200 dark:border-gray-800/60 bg-gray-100 dark:bg-dark-surface">
              <div className="flex items-center h-full">
                <div className="flex items-center gap-2 px-4 h-full border-r border-gray-200 dark:border-gray-800/60 border-t-2 border-t-azure dark:border-t-yellow bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-azure dark:bg-yellow" />
                  {filename}
                </div>
                <button className="flex items-center justify-center w-8 h-full text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors text-base">
                  +
                </button>
              </div>
              <div className="ml-auto flex items-center gap-3 px-4 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                <span>UTF-8</span>
                <span>LF</span>
                <span>Spaces: 4</span>
              </div>
            </div>

            {/* Monaco */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CodeEditor
                language={MONACO_LANG_MAP[selectedLanguage]}
                value={code}
                onChange={setCode}
              />
            </div>

            {/* Editor status bar */}
            <div className="h-6 flex-shrink-0 flex items-center justify-between px-3 bg-gray-50 dark:bg-dark-surface border-t border-gray-200 dark:border-gray-800/60 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Saved
              </span>
              <div className="flex items-center gap-4">
                <span>{langVersion}</span>
                <span>auto-format: on</span>
                <span className="text-gray-300 dark:text-yellow">⌘K to submit</span>
              </div>
            </div>
          </div>

          {/* ── Test Cases panel ── */}
          <div className="h-56 flex-shrink-0 flex flex-col bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-800/60 overflow-hidden">

            {/* Test panel header: tabs + pills */}
            <div className="flex-shrink-0 flex items-center border-b border-gray-200 dark:border-gray-800/60 px-2">
              <div className="flex">
                {(["testcases", "output", "stderr", "verdict"] as TestTab[]).map((tab) => {
                  const labels: Record<TestTab, string> = {
                    testcases: "Test cases",
                    output: "Output",
                    stderr: "Stderr",
                    verdict: "Verdict",
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setTestTab(tab)}
                      className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                        testTab === tab
                          ? "border-azure text-azure dark:border-yellow dark:text-yellow"
                          : "border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {testTab === "testcases" && (
                <div className="flex items-center gap-1.5 ml-3 overflow-x-auto flex-1 py-1.5">
                  {testCases.map((_, i) => {
                    const result = report?.testCaseResults?.[i];
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedCase(i)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium flex-shrink-0 transition-all border ${
                          selectedCase === i
                            ? "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-700/60 dark:border-gray-600 dark:text-gray-200"
                            : "border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${result ? (STATUS_DOT[result.status] ?? "bg-gray-400") : "bg-gray-300 dark:bg-gray-600"}`} />
                        {String(i + 1).padStart(2, "0")}
                      </button>
                    );
                  })}
                  <button
                    onClick={addTestCase}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors flex-shrink-0 border border-transparent hover:border-gray-300 dark:hover:border-gray-700"
                  >
                    + case
                  </button>
                </div>
              )}
            </div>

            {/* Test content */}
            <div className="flex-1 min-h-0 overflow-auto">
              {testTab === "testcases" && (
                <TestCasesContent
                  testCases={testCases}
                  selectedCase={selectedCase}
                  report={report}
                  execError={execError}
                  onUpdate={updateTestCase}
                  onRemove={removeTestCase}
                />
              )}
              {testTab === "output" && (
                <OutputContent result={report?.testCaseResults?.[selectedCase]} field="stdout" />
              )}
              {testTab === "stderr" && (
                <OutputContent result={report?.testCaseResults?.[selectedCase]} field="stderr" />
              )}
              {testTab === "verdict" && (
                <VerdictContent report={report} execError={execError} />
              )}
            </div>

            {report && (
              <ResultsStatusBar report={report} timeLimitMs={assignment.timeLimitMs} memoryLimitMb={assignment.memoryLimitMb} />
            )}
          </div>
        </div>
      </div>

      {/* ── Floating AI Assistant ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {aiOpen && (
          <div className="w-80 h-96 flex flex-col bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-2xl overflow-hidden">
            {/* AI panel header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-dark-surface">
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">✨</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">AI Assistant</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {aiMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-gray-500 text-center px-4">
                  Ask me anything about this problem!
                </div>
              ) : (
                aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-azure text-white"
                        : "bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700/60">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendAiMessage(); }}
                placeholder="Ask a question…"
                className="flex-1 text-xs bg-gray-100 dark:bg-dark-surface text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-azure placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
              <button
                onClick={sendAiMessage}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-azure text-white hover:bg-french transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Toggle button — hexagon shape */}
        <div className="filter drop-shadow-xl">
          <button
            onClick={() => setAiOpen((o) => !o)}
            title="AI Assistant"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            className={`w-12 h-12 flex items-center justify-center transition-all ${
              aiOpen
                ? "bg-azure text-white"
                : "bg-yellow text-dark-bg"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </button>
        </div>
      </div>
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

function MySubsTab() {
  return <EmptyState label="No submissions yet. Submit your code to see results here." />;
}

/* ── Test panel contents ── */

function TestCasesContent({
  testCases,
  selectedCase,
  report,
  execError,
  onUpdate,
  onRemove,
}: {
  testCases: string[];
  selectedCase: number;
  report: ExecutionReport | null;
  execError: string | null;
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const tc = testCases[selectedCase] ?? "";
  const result = report?.testCaseResults?.[selectedCase];
  const hasResult = !!result;

  return (
    <div className="h-full flex flex-col">
      {execError && (
        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border-b border-red-500/20 flex-shrink-0">
          {execError}
        </div>
      )}
      {report?.compilationError && (
        <div className="px-4 py-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-500/10 border-b border-yellow-500/20 font-mono whitespace-pre-wrap flex-shrink-0">
          {report.compilationError}
        </div>
      )}

      {hasResult ? (
        /* 3-column result view */
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

          <Column label="EXPECTED" headerRight={<span className="text-[10px] text-gray-400 dark:text-gray-600">reference solution</span>}>
            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 p-3 whitespace-pre-wrap">
              {(result as any).expectedOutput ?? "—"}
            </pre>
          </Column>

          <Column
            label="YOUR OUTPUT"
            headerRight={
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${VERDICT_STYLES[result.status] ?? ""}`}>
                {result.status}
              </span>
            }
          >
            <div className="p-3 space-y-2">
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {(result as any).actualOutput ?? "—"}
              </pre>
              {result.executionTimeMs !== undefined && (
                <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                  {result.executionTimeMs}ms · {result.memoryUsedMb ?? 0}MB
                </p>
              )}
            </div>
          </Column>
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

function OutputContent({
  result,
  field,
}: {
  result?: TestCaseResult;
  field: "stdout" | "stderr";
}) {
  const content = result ? ((result as any)[field] ?? "—") : null;
  if (!result) return <EmptyState label="Run the code to see output." />;
  return (
    <pre className="p-3 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap h-full overflow-auto">
      {content}
    </pre>
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
        <pre className="text-xs font-mono text-yellow-700 dark:text-yellow-300 bg-yellow-500/10 rounded p-2 whitespace-pre-wrap border border-yellow-500/20">
          {report.compilationError}
        </pre>
      )}
      <div className="space-y-1.5">
        {report.testCaseResults?.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[r.status] ?? "bg-gray-400"}`} />
            <span className="text-gray-400 dark:text-gray-500 font-mono w-12">Case {i + 1}</span>
            <span className={`font-medium ${r.status === "AC" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{r.status}</span>
            {r.executionTimeMs !== undefined && (
              <span className="text-gray-400 dark:text-gray-600 ml-auto font-mono">{r.executionTimeMs}ms</span>
            )}
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
        {report.maxMemoryUsedMb !== undefined && (
          <span>mem {report.maxMemoryUsedMb?.toFixed(1)}MB/{memoryLimitMb}MB</span>
        )}
        <span>exit 0</span>
      </div>
    </div>
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

function MobileTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-xs font-medium transition-colors ${
        active
          ? "text-azure dark:text-yellow border-b-2 border-azure dark:border-yellow"
          : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
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
