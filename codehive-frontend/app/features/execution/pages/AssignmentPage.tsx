import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Group as PanelGroup, Panel } from "react-resizable-panels";
import { CodeEditor } from "~/shared/components/CodeEditor";
import { useAuth } from "~/core/providers/AuthProvider";

import { getAssignment, getSampleInputs } from "../../student/api/assignment.api";
import type { Assignment, Language } from "../../student/types/assignment.types";

import { useExecutionRunner } from "../hooks/useExecutionRunner";
import { useIsDesktop } from "../hooks/useIsDesktop";

import { ProblemPanel } from "../components/ProblemPanel";
import { TestCasePanel } from "../components/TestCasePanel";
import { LoadingScreen, ErrorScreen } from "../components/FeedbackScreens";
import { TabBtn, ResizeHandle } from "../components/LayoutComponents";

import {
  LANGUAGE_LABELS,
  MONACO_LANG_MAP,
  LANGUAGE_TEMPLATES,
} from "../config/execution.constants";

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
  const [sampleCount, setSampleCount] = useState(0);

  const { isRunning, report, execError, runCode } = useExecutionRunner();
  const [activeTab, setActiveTab] = useState<ActiveTab>("problem");
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getAssignment(id), getSampleInputs(id)])
      .then(([a, samples]) => {
        setAssignment(a);
        if (a.allowedLanguages?.length > 0) {
          setSelectedLanguage(a.allowedLanguages[0]);
          setCode(LANGUAGE_TEMPLATES[a.allowedLanguages[0]] ?? "");
        }
        if (samples.length > 0) {
          setTestCases([...samples, ""]);
          setSampleCount(samples.length);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleLanguageChange(lang: Language) {
    setSelectedLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang] ?? "");
  }

  function handleRun() {
    if (assignment) {
      runCode(code, selectedLanguage, assignment.id, testCases, user?.id);
    }
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
                    setTestCases={setTestCases}
                    report={report}
                    execError={execError}
                    sampleCount={sampleCount}
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
              <div className="flex-shrink-0 h-52 border-t border-gray-200 dark:border-gray-700/50 bg-white dark:bg-dark-surface flex flex-col">
                <TestCasePanel
                  testCases={testCases}
                  setTestCases={setTestCases}
                  report={report}
                  execError={execError}
                  sampleCount={sampleCount}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
