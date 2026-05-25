import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Clock, Cpu, Scale } from "lucide-react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { CodeEditor } from "~/shared/components/CodeEditor";
import { useAuth } from "~/core/providers/AuthProvider";
import { getAssignment } from "../api/assignment.api";
import type { Assignment, Language } from "../types/assignment.types";
import {
  submitExecution,
  getExecution,
  getExecutionReport,
} from "../api/execution.api";
import type { ExecutionReport } from "../types/execution.types";
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

const LANGUAGE_COLORS: Record<Language, string> = {
  JAVA: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700/40",
  PYTHON: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700/40",
  CPP: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700/40",
  C: "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600/40",
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

const STATUS_STYLES: Record<string, string> = {
  AC: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/50",
  WA: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50",
  TLE: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700/50",
  MLE: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700/50",
  OLE: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-700/50",
  RTE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50",
  CE: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700/50",
  PENDING:
    "bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow border-azure/20 dark:border-yellow/20 animate-pulse",
};

type ActiveTab = "problem" | "editor";

export function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>("PYTHON");
  const [code, setCode] = useState(LANGUAGE_TEMPLATES["PYTHON"]);
  const [testCases, setTestCases] = useState<string[]>([""]);
  const [selectedTestCase, setSelectedTestCase] = useState<number>(0);

  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("problem");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAssignment(id)
      .then((a) => {
        setAssignment(a);
        if (a.allowedLanguages?.length > 0) {
          setSelectedLanguage(a.allowedLanguages[0]);
          setCode(LANGUAGE_TEMPLATES[a.allowedLanguages[0]] ?? "");
        }
        if (a.sampleTestCases && a.sampleTestCases.length > 0) {
          const sorted = [...a.sampleTestCases].sort((x, y) => x.order - y.order);
          setTestCases(sorted.map((tc) => tc.input));
          setSelectedTestCase(0);
        } else {
          setTestCases([""]);
          setSelectedTestCase(0);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function handleLanguageChange(lang: Language) {
    setSelectedLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang] ?? "");
  }

  async function handleRun() {
    if (!assignment || !code.trim() || isRunning) return;
    setIsRunning(true);
    setReport(null);
    setExecError(null);

    try {
      const dto = await submitExecution({
        code,
        language: selectedLanguage as unknown as ExecLanguage,
        requesterId: user?.id,
        assignmentId: assignment.id,
        testCases: testCases.filter((tc) => tc.trim().length > 0),
        executionType: ExecutionType.PRACTICE,
      });

      let attempts = 0;
      const maxAttempts = 40;

      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          attempts++;
          try {
            const updated = await getExecution(dto.id);
            if (updated.status !== ExecutionStatus.PENDING) {
              if (pollRef.current) clearInterval(pollRef.current);
              try {
                const r = await getExecutionReport(dto.id);
                setReport(r);
              } catch {
                // Report not available for CE
              }
              resolve();
            } else if (attempts >= maxAttempts) {
              if (pollRef.current) clearInterval(pollRef.current);
              reject(new Error("Execution timed out. Please try again."));
            }
          } catch (e) {
            if (pollRef.current) clearInterval(pollRef.current);
            reject(e);
          }
        }, 1500);
      });
    } catch (e: unknown) {
      setExecError(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      setIsRunning(false);
    }
  }

  function addTestCase() {
    setTestCases((prev) => {
      if (prev.length >= 30) return prev;
      const next = [...prev, ""];
      setSelectedTestCase(next.length - 1);
      return next;
    });
  }

  function removeTestCase(i: number) {
    setTestCases((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      setSelectedTestCase((sel) => Math.min(sel, next.length - 1));
      return next;
    });
  }

  function updateTestCase(i: number, value: string) {
    setTestCases((prev) => prev.map((tc, idx) => (idx === i ? value : tc)));
  }

  const allowedLangs = assignment?.allowedLanguages ?? (["PYTHON"] as Language[]);

  if (loading) return <LoadingScreen />;
  if (error || !assignment) return <ErrorScreen message={error ?? "Assignment not found."} />;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white font-sans">
      {/* Header */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-dark-surface z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/dashboard"
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow hover:bg-azure/10 dark:hover:bg-yellow/10 transition-colors"
            aria-label="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-azure dark:text-yellow flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="font-semibold text-sm truncate text-gray-900 dark:text-white">
              {assignment.title}
            </span>
          </div>
          {assignment.isActive && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/40 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow transition-colors hidden sm:block"
          >
            {allowedLangs.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Running…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run
              </>
            )}
          </button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-dark-surface flex-shrink-0">
        <TabBtn active={activeTab === "problem"} onClick={() => setActiveTab("problem")}>
          Problem
        </TabBtn>
        <TabBtn active={activeTab === "editor"} onClick={() => setActiveTab("editor")}>
          Editor
        </TabBtn>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {isDesktop ? (
          /* Desktop: resizable panels */
          <PanelGroup orientation="horizontal" className="flex-1">
            {/* Problem panel */}
            <Panel defaultSize="38" minSize="20" maxSize="60">
              <div className="h-full overflow-y-auto bg-white dark:bg-dark-surface">
                <ProblemPanel assignment={assignment} />
              </div>
            </Panel>

            <ResizeHandle direction="horizontal" />

            {/* Editor + Tests panel */}
            <Panel minSize="30">
              <PanelGroup orientation="vertical" className="h-full">
                {/* Monaco Editor */}
                <Panel defaultSize="68" minSize="25">
                  <CodeEditor
                    language={MONACO_LANG_MAP[selectedLanguage]}
                    value={code}
                    onChange={setCode}
                  />
                </Panel>

                <ResizeHandle direction="vertical" />

                {/* Test Cases */}
                <Panel defaultSize="32" minSize="12" maxSize="60">
                  <TestCasePanel
                    testCases={testCases}
                    selectedTestCase={selectedTestCase}
                    setSelectedTestCase={setSelectedTestCase}
                    onAdd={addTestCase}
                    onRemove={removeTestCase}
                    onUpdate={updateTestCase}
                    report={report}
                    execError={execError}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        ) : (
          /* Mobile: tab-based layout */
          <>
            {/* Left: Problem */}
            <aside
              className={`w-full overflow-y-auto bg-white dark:bg-dark-surface ${
                activeTab !== "problem" ? "hidden" : "block"
              }`}
            >
              <ProblemPanel assignment={assignment} />
            </aside>

            {/* Right: Editor + Tests */}
            <div
              className={`flex-1 flex flex-col min-h-0 ${
                activeTab !== "editor" ? "hidden" : "flex"
              }`}
            >
              {/* Mobile language select */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-dark-surface flex-shrink-0">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow"
                >
                  {allowedLangs.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <CodeEditor
                  language={MONACO_LANG_MAP[selectedLanguage]}
                  value={code}
                  onChange={setCode}
                />
              </div>

              {/* Test Cases Panel */}
              <div className="flex-shrink-0 h-64 border-t border-gray-200 dark:border-gray-700/50">
                <TestCasePanel
                  testCases={testCases}
                  selectedTestCase={selectedTestCase}
                  setSelectedTestCase={setSelectedTestCase}
                  onAdd={addTestCase}
                  onRemove={removeTestCase}
                  onUpdate={updateTestCase}
                  report={report}
                  execError={execError}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TestCasePanel({
  testCases,
  selectedTestCase,
  setSelectedTestCase,
  onAdd,
  onRemove,
  onUpdate,
  report,
  execError,
}: {
  testCases: string[];
  selectedTestCase: number;
  setSelectedTestCase: (i: number) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, value: string) => void;
  report: ExecutionReport | null;
  execError: string | null;
}) {
  const selected = Math.min(selectedTestCase, testCases.length - 1);
  const result = report?.testCaseResults?.[selected];
  const tc = testCases[selected] ?? "";

  return (
    <div className="h-full bg-white dark:bg-dark-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Test Cases</span>
          {report && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {report.passedTests}/{report.totalTests} passed
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          disabled={testCases.length >= 30}
          className="inline-flex items-center gap-1 text-xs font-medium text-azure dark:text-yellow hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add {testCases.length >= 30 ? "(max)" : ""}
        </button>
      </div>

      {/* Error / Compilation */}
      {execError && (
        <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
          {execError}
        </div>
      )}
      {report?.compilationError && (
        <div className="px-4 py-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 font-mono whitespace-pre-wrap flex-shrink-0">
          {report.compilationError}
        </div>
      )}

      {/* Body: tab bar + content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: vertical tab bar */}
        <div className="w-28 flex-shrink-0 border-r border-gray-200 dark:border-gray-700/50 overflow-y-auto">
          {testCases.map((_, i) => {
            const r = report?.testCaseResults?.[i];
            const isSelected = i === selected;
            return (
              <button
                key={i}
                onClick={() => setSelectedTestCase(i)}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium transition-colors border-b border-gray-100 dark:border-gray-700/30 ${
                  isSelected
                    ? "bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card"
                }`}
              >
                <span>Test {i + 1}</span>
                {r && (
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    r.status === "AC" ? "bg-green-500" :
                    r.status === "PENDING" ? "bg-yellow-400 animate-pulse" :
                    "bg-red-500"
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: input + result */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Tab header with remove button */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-700/30 flex-shrink-0">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Test {selected + 1}
              {result && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLES[result.status] ?? ""}`}>
                  {result.status}
                </span>
              )}
            </span>
            {testCases.length > 1 && (
              <button
                onClick={() => onRemove(selected)}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Remove test case"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Input label + textarea */}
          <div className="px-3 pt-2 pb-1 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-semibold">Input</span>
          </div>
          <textarea
            value={tc}
            onChange={(e) => onUpdate(selected, e.target.value)}
            placeholder="Enter input…"
            className="flex-1 w-full resize-none bg-transparent text-xs font-mono px-3 pb-2 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 min-h-[60px]"
          />

          {/* Result details */}
          {result && (
            <div className="border-t border-gray-100 dark:border-gray-700/30 px-3 py-2 space-y-2 flex-shrink-0">
              {/* Timing */}
              {(result.executionTimeMs !== undefined || result.memoryUsedMb !== undefined) && (
                <div className="flex gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                  {result.executionTimeMs !== undefined && <span>{result.executionTimeMs}ms</span>}
                  {result.memoryUsedMb !== undefined && result.memoryUsedMb > 0 && <span>{result.memoryUsedMb}MB</span>}
                </div>
              )}
              {/* Expected / Got for WA */}
              {result.status === "WA" && result.expectedOutput !== undefined && (
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Expected</div>
                    <pre className="text-xs font-mono bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded p-1.5 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                      {result.expectedOutput}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Got</div>
                    <pre className="text-xs font-mono bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded p-1.5 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                      {result.actualOutput ?? ""}
                    </pre>
                  </div>
                </div>
              )}
              {/* Feedback for non-WA failures */}
              {result.status !== "AC" && result.status !== "WA" && result.feedback && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400 italic">{result.feedback}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProblemPanel({ assignment }: { assignment: Assignment }) {
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {assignment.isActive && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/40">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
              Active
            </span>
          )}
          {assignment.dueDate && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
              isOverdue
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700/50"
                : "bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/50"
            }`}>
              Due {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{assignment.title}</h1>
      </div>

      {/* Limits */}
      <div className="flex flex-wrap gap-3">
        <LimitChip icon={<Clock className="w-3.5 h-3.5" />} label={`${assignment.timeLimitMs ?? "—"}ms`} />
        <LimitChip icon={<Cpu className="w-3.5 h-3.5" />} label={`${assignment.memoryLimitMb ?? "—"}MB`} />
        {assignment.comparatorType && (
          <LimitChip icon={<Scale className="w-3.5 h-3.5" />} label={assignment.comparatorType === "EXACT_MATCH" ? "Exact Match" : "Floating Point"} />
        )}
      </div>

      {/* Description */}
      {assignment.description && (
        <Section title="Problem Statement">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
            {assignment.description}
          </p>
        </Section>
      )}

      {/* Constraints */}
      {assignment.constraints?.length > 0 && (
        <Section title="Constraints">
          <ul className="space-y-1.5">
            {assignment.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-azure dark:bg-yellow flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Hints */}
      {assignment.hints?.length > 0 && (
        <Section title="Hints">
          <ul className="space-y-1.5">
            {assignment.hints.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 italic">
                <span className="text-azure dark:text-yellow font-bold not-italic flex-shrink-0">{i + 1}.</span>
                {h}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Tags */}
      {assignment.tags?.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-2">
            {assignment.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {assignment.allowedLanguages?.length > 0 && (
        <Section title="Allowed Languages">
          <div className="flex flex-wrap gap-2">
            {assignment.allowedLanguages.map((lang) => (
              <span
                key={lang}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${LANGUAGE_COLORS[lang]}`}
              >
                {LANGUAGE_LABELS[lang]}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function LimitChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50">
      {icon}
      {label}
    </span>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-azure dark:text-yellow border-b-2 border-azure dark:border-yellow"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ResizeHandle({ direction }: { direction: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center z-10 transition-colors duration-150 ${
        direction === "horizontal"
          ? "w-1.5 cursor-col-resize bg-gray-200 dark:bg-gray-700/50 hover:bg-azure/20 dark:hover:bg-yellow/10"
          : "h-1.5 cursor-row-resize bg-gray-200 dark:bg-gray-700/50 hover:bg-azure/20 dark:hover:bg-yellow/10"
      }`}
    >
      <div
        className={`rounded-full bg-gray-400 dark:bg-gray-500 group-hover:bg-azure dark:group-hover:bg-yellow transition-colors duration-150 ${
          direction === "horizontal" ? "w-0.5 h-8" : "h-0.5 w-8"
        }`}
      />
    </PanelResizeHandle>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-azure to-french mb-4">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading assignment…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Assignment not found</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
