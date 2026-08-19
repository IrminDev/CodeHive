import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Clock, Database, FileCode, Lock } from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { CodeEditor } from "~/shared/components/CodeEditor";
import { getTeacherAssignmentPreview } from "../api/assignment.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type { AssignmentPreview, Language } from "../types/assignment.types";

const MONACO_LANGUAGE: Record<Language, string> = {
  PYTHON: "python",
  JAVA: "java",
  CPP: "cpp",
  C: "c",
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Not set";
}

export function TeacherAssignmentPreviewPage() {
  const navigate = useNavigate();
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();
  const [preview, setPreview] = useState<AssignmentPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getTeacherAssignmentPreview(assignmentId)
      .then((result) => { if (!cancelled) setPreview(result); })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load assignment preview." });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assignmentId]);

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">Loading assignment preview…</div>;
  if (!preview) return <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">Assignment preview unavailable.</div>;

  const { assignment, referenceLanguage, referenceSolution, testCases } = preview;
  const outputsReady = assignment.validationStatus === "READY";
  const examples = assignment.examples ?? [];

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button onClick={() => navigate("/teacher/assignments")} className="btn-outline p-2.5" aria-label="Back to assignments"><ArrowLeft size={16} /></button>
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-azure dark:text-yellow">Teacher preview</p>
              <h1 className="text-3xl font-bold mt-1">{assignment.title}</h1>
              <p className="text-gray-500 mt-1">Read-only view of assignment details, reference solution, and generated test outputs.</p>
            </div>
          </div>
          <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${outputsReady ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-yellow/15 text-yellow-700 dark:text-yellow"}`}>{assignment.validationStatus}</span>
        </header>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="font-semibold text-lg">Problem</h2>
            <p className="mt-3 whitespace-pre-wrap text-gray-600 dark:text-gray-300">{assignment.description}</p>
            {assignment.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-5">{assignment.tags.map((tag) => <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow">{tag}</span>)}</div>}
          </div>
          <div className="grid content-start gap-3 text-sm">
            <Detail label="Time limit" value={`${assignment.timeLimitMs} ms`} icon={<Clock size={15} />} />
            <Detail label="Memory limit" value={`${assignment.memoryLimitMb} MB`} icon={<Database size={15} />} />
            <Detail label="Max points" value={String(assignment.maxPoints)} icon={<CheckCircle2 size={15} />} />
            <Detail label="Comparator" value={assignment.comparatorType.replaceAll("_", " ")} icon={<FileCode size={15} />} />
            <Detail label="Launch" value={formatDate(assignment.launchDate)} icon={<Clock size={15} />} />
            <Detail label="Due" value={formatDate(assignment.dueDate)} icon={<Clock size={15} />} />
          </div>
        </section>

        {(assignment.constraints.length > 0 || assignment.hints.length > 0 || examples.length > 0) && (
          <section className="grid gap-6 lg:grid-cols-3">
            <InfoList title="Constraints" items={assignment.constraints} />
            <InfoList title="Hints" items={assignment.hints} />
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5">
              <h2 className="font-semibold">Public examples</h2>
              {examples.length === 0 ? <p className="mt-3 text-sm text-gray-500">No public examples.</p> : examples.map((example, index) => <div key={`${example.input}-${example.output}-${index}`} className="mt-3 text-sm"><p className="font-medium">Example {index + 1}</p><p className="mt-1 text-gray-500 whitespace-pre-wrap">{example.explanation}</p></div>)}
            </div>
          </section>
        )}

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/40 flex items-center gap-2"><Lock size={16} className="text-gray-500" /><div><h2 className="font-semibold">Reference solution</h2><p className="text-xs text-gray-500 mt-0.5">{referenceLanguage} · read only</p></div></div>
          <div className="h-[420px]"><CodeEditor value={referenceSolution} language={MONACO_LANGUAGE[referenceLanguage]} readOnly options={{ domReadOnly: true }} /></div>
        </section>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/40"><h2 className="font-semibold">Private test cases and generated outputs</h2><p className="text-sm text-gray-500 mt-1">Visible only to assignment owner. Inputs stay private from students.</p></div>
          {!outputsReady && <div className="mx-6 mt-5 rounded-xl border border-yellow/30 bg-yellow/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow">Expected outputs appear here after worker validation reaches READY.</div>}
          <div className="p-6 grid gap-5">
            {testCases.map((testCase) => (
              <article key={testCase.order} className="rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                <header className="px-4 py-3 bg-gray-50 dark:bg-dark-surface flex items-center justify-between"><h3 className="font-semibold text-sm">Test case {testCase.order}</h3>{testCase.sample && <span className="text-xs font-semibold text-azure dark:text-yellow">Public sample</span>}</header>
                <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700/50">
                  <CodeBlock title="Input" value={testCase.input} />
                  <CodeBlock title="Expected output" value={testCase.expectedOutput} unavailable={!outputsReady} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-gray-500">{icon}{label}</span><strong className="text-right">{value}</strong></div>;
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5"><h2 className="font-semibold">{title}</h2>{items.length === 0 ? <p className="mt-3 text-sm text-gray-500">None.</p> : <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">{items.map((item) => <li key={item}>• {item}</li>)}</ul>}</div>;
}

function CodeBlock({ title, value, unavailable = false }: { title: string; value?: string; unavailable?: boolean }) {
  return <div className="p-4"><p className="text-xs uppercase tracking-widest text-gray-500 mb-2">{title}</p>{unavailable ? <p className="text-sm text-gray-500">Unavailable until validation completes.</p> : <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 dark:bg-dark-surface p-3 text-sm font-mono">{value ?? ""}</pre>}</div>;
}
