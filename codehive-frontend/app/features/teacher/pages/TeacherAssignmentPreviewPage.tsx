import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, Eye, Lock, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router";

import { CodeEditor } from "~/shared/components/CodeEditor";
import {
  AssignmentDetailsPanel,
  type AssignmentDetailsTab,
} from "~/shared/components/AssignmentDetailsPanel";
import {
  AssignmentWorkspace,
  type AssignmentWorkspacePane,
} from "~/shared/components/AssignmentWorkspace";
import { getTeacherAssignmentPreview } from "../api/assignment.api";
import type {
  AssignmentPreview,
  AssignmentPreviewTestCase,
  Language,
} from "../types/assignment.types";

const MONACO_LANGUAGE: Record<Language, string> = {
  PYTHON: "python",
  JAVA: "java",
  CPP: "cpp",
  C: "c",
};

const LANGUAGE_FILE: Record<Language, string> = {
  PYTHON: "solution.py",
  JAVA: "Main.java",
  CPP: "solution.cpp",
  C: "solution.c",
};

const LANGUAGE_VERSION: Record<Language, string> = {
  PYTHON: "Python 3.11",
  JAVA: "Java 21",
  CPP: "C++17",
  C: "C11",
};

export function TeacherAssignmentPreviewPage() {
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();
  const [preview, setPreview] = useState<AssignmentPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<AssignmentDetailsTab>("assignment");
  const [mobilePane, setMobilePane] = useState<AssignmentWorkspacePane>("assignment");
  const [selectedTest, setSelectedTest] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPreview(await getTeacherAssignmentPreview(assignmentId));
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Failed to load assignment preview.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <PreviewLoading />;
  if (!preview) return <PreviewError message={error ?? "Assignment preview is unavailable."} onRetry={() => void load()} />;

  const { assignment, referenceLanguage, referenceSolution, testCases } = preview;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <header className="h-14 flex-shrink-0 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface px-3 sm:px-4">
        <Link to="/teacher/assignments" aria-label="Back to assignments" className="w-9 h-9 grid place-items-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-azure dark:hover:text-yellow transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-semibold text-azure dark:text-yellow">Teacher preview</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500"><Eye size={11} /> Student-like layout</span>
          </div>
          <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{assignment.title}</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-500 dark:text-gray-400">
          <span>{referenceLanguage}</span>
          <span>·</span>
          <span>Read only</span>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${assignment.validationStatus === "READY" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : assignment.validationStatus === "FAILED" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow/10 text-yellow-700 dark:text-yellow border-yellow/20"}`}>
          {assignment.validationStatus}
        </span>
      </header>

      <div className="flex items-center gap-2 border-b border-azure/20 dark:border-yellow/20 bg-azure/5 dark:bg-yellow/5 px-4 py-2 text-[11px] text-gray-600 dark:text-gray-300">
        <Lock size={12} className="text-azure dark:text-yellow" />
        Preview only. Reference solution and private expected outputs remain teacher-visible.
      </div>

      <AssignmentWorkspace
        persistenceKey="codehive-teacher-assignment-preview"
        editorLabel="Reference"
        mobilePane={mobilePane}
        onMobilePaneChange={setMobilePane}
        assignmentPane={(
          <AssignmentDetailsPanel
            assignment={assignment}
            tab={detailsTab}
            onTabChange={setDetailsTab}
            note={(
              <div>
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow">Preview scope</p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">This pane mirrors information students receive. Private tests remain in teacher-only Tests pane.</p>
              </div>
            )}
          />
        )}
        editorPane={<ReferenceSolutionPane language={referenceLanguage} source={referenceSolution} />}
        testsPane={(
          <TeacherTestsPane
            testCases={testCases}
            selectedTest={selectedTest}
            outputsReady={assignment.validationStatus === "READY"}
            onSelect={setSelectedTest}
          />
        )}
      />
    </div>
  );
}

function ReferenceSolutionPane({ language, source }: { language: Language; source: string }) {
  return (
    <section className="h-full min-h-0 flex flex-col overflow-hidden bg-white dark:bg-dark-card">
      <div className="h-9 flex-shrink-0 flex items-center border-b border-gray-200 dark:border-gray-800/60 bg-gray-100 dark:bg-dark-surface">
        <div className="flex items-center gap-2 px-4 h-full border-r border-gray-200 dark:border-gray-800/60 border-t-2 border-t-azure dark:border-t-yellow bg-white dark:bg-dark-card text-xs font-mono text-gray-700 dark:text-gray-200">
          <Lock size={12} className="text-azure dark:text-yellow" />
          {LANGUAGE_FILE[language]}
        </div>
        <span className="ml-auto px-4 text-[10px] font-mono text-gray-400 dark:text-gray-600">REFERENCE · READ ONLY</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <CodeEditor value={source} language={MONACO_LANGUAGE[language]} readOnly options={{ domReadOnly: true }} />
      </div>
      <div className="h-6 flex-shrink-0 flex items-center justify-between border-t border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface px-3 text-[10px] font-mono text-gray-400 dark:text-gray-600">
        <span className="flex items-center gap-1"><Lock size={10} />Protected reference</span>
        <div className="flex items-center gap-4"><span>{LANGUAGE_VERSION[language]}</span><span>{source.split("\n").length} lines</span></div>
      </div>
    </section>
  );
}

function TeacherTestsPane({
  testCases,
  selectedTest,
  outputsReady,
  onSelect,
}: {
  testCases: AssignmentPreviewTestCase[];
  selectedTest: number;
  outputsReady: boolean;
  onSelect: (index: number) => void;
}) {
  const selected = testCases[selectedTest];
  return (
    <section className="h-full min-h-0 flex flex-col overflow-hidden bg-white dark:bg-dark-surface">
      <div className="flex-shrink-0 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800/60 px-3">
        <div className="border-b-2 border-azure dark:border-yellow px-1 py-2 text-xs font-medium text-azure dark:text-yellow">Private tests</div>
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-1.5">
          {testCases.map((testCase, index) => (
            <button key={testCase.order} onClick={() => onSelect(index)} className={`flex flex-shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-mono transition-colors ${selectedTest === index ? "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-200" : "border-transparent text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${outputsReady ? "bg-green-500" : "bg-yellow"}`} />
              {String(testCase.order).padStart(2, "0")}
              {testCase.sample && <span className="text-azure dark:text-yellow">sample</span>}
            </button>
          ))}
        </div>
        <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-gray-500">{testCases.length} cases</span>
      </div>

      {!selected ? (
        <div className="flex flex-1 items-center justify-center text-xs text-gray-400 dark:text-gray-600">No test cases available.</div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col sm:flex-row divide-y sm:divide-x sm:divide-y-0 divide-gray-200 dark:divide-gray-800/60">
          <TestValue label="Input" value={selected.input} detail={selected.sample ? "Public sample" : "Private input"} />
          <TestValue label="Expected output" value={selected.expectedOutput} detail="Generated by worker validation" unavailable={!outputsReady} />
        </div>
      )}
      <div className={`flex-shrink-0 border-t px-3 py-2 text-[10px] ${outputsReady ? "border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400" : "border-yellow/20 bg-yellow/5 text-yellow-700 dark:text-yellow"}`}>
        {outputsReady ? "Expected outputs generated and ready for review." : "Expected outputs become available after successful validation."}
      </div>
    </section>
  );
}

function TestValue({ label, value, detail, unavailable = false }: { label: string; value?: string; detail: string; unavailable?: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/60 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">{label}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600">{detail}</span>
      </div>
      {unavailable ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-gray-400 dark:text-gray-600">Unavailable until validation completes.</div>
      ) : (
        <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-3 text-xs font-mono text-gray-700 dark:text-gray-300">{value ?? ""}</pre>
      )}
    </div>
  );
}

function PreviewLoading() {
  return <div className="h-screen grid place-items-center bg-white dark:bg-dark-bg text-gray-500"><div className="text-center"><RefreshCw size={24} className="mx-auto mb-3 animate-spin text-azure dark:text-yellow" /><p className="text-sm">Loading teacher preview…</p></div></div>;
}

function PreviewError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="h-screen grid place-items-center bg-white dark:bg-dark-bg p-6 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <CircleAlert size={28} className="mx-auto mb-3 text-red-500" />
        <h1 className="font-semibold">Preview unavailable</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="mt-5 flex justify-center gap-3"><Link to="/teacher/assignments" className="btn-outline">Back</Link><button onClick={onRetry} className="btn-primary">Try again</button></div>
      </div>
    </div>
  );
}
