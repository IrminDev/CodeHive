import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Code2, FileWarning, Gauge, HardDrive, History, LoaderCircle, RefreshCw, Zap } from "lucide-react";

import { ApiError } from "../api/client";
import { getAssignment } from "../api/assignment.api";
import { getExecution, getExecutionReport } from "../api/execution.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { Assignment } from "../types/assignment.types";
import { ExecutionStatus, type ExecutionDTO, type ExecutionReport, type TestCaseResult } from "../types/execution.types";

const TERMINAL = new Set<ExecutionStatus>([
  ExecutionStatus.AC, ExecutionStatus.WA, ExecutionStatus.TLE, ExecutionStatus.MLE,
  ExecutionStatus.OLE, ExecutionStatus.RTE, ExecutionStatus.CE,
]);
const VERDICTS: Record<ExecutionStatus, { label: string; className: string; icon: React.ReactNode; bar: string }> = {
  AC: { label: "Accepted", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: <CheckCircle2 size={22} />, bar: "bg-green-500" },
  WA: { label: "Wrong answer", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: <AlertCircle size={22} />, bar: "bg-red-500" },
  TLE: { label: "Time limit exceeded", className: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: <Clock3 size={22} />, bar: "bg-orange-500" },
  MLE: { label: "Memory limit exceeded", className: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: <HardDrive size={22} />, bar: "bg-purple-500" },
  OLE: { label: "Output limit exceeded", className: "bg-pink-500/10 text-pink-500 border-pink-500/20", icon: <Zap size={22} />, bar: "bg-pink-500" },
  RTE: { label: "Runtime error", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: <AlertCircle size={22} />, bar: "bg-red-500" },
  CE: { label: "Compilation error", className: "bg-yellow/10 text-yellow border-yellow/20", icon: <Code2 size={22} />, bar: "bg-yellow" },
  PENDING: { label: "Evaluating", className: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: <LoaderCircle size={22} className="animate-spin" />, bar: "bg-gray-400" },
};

function reportedMemory(...values: Array<number | undefined>): number | undefined {
  return values.find((value) => value != null && value > 0);
}

function testDiagnostic(test: TestCaseResult): string | null {
  if (![ExecutionStatus.RTE, ExecutionStatus.MLE, ExecutionStatus.CE].includes(test.status)) return null;
  if (test.stderr?.trim()) return test.stderr.trim();
  return test.exitCode == null ? null : `Process exited with code ${test.exitCode} without diagnostic output.`;
}

export function ExecutionReportPage() {
  const { id = "", executionId = "" } = useParams<{ id: string; executionId: string }>();
  const [searchParams] = useSearchParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [execution, setExecution] = useState<ExecutionDTO | null>(null);
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    const assignmentRequest = getAssignment(id);

    async function load() {
      try {
        const assignmentResult = await assignmentRequest;
        if (cancelled) return;
        setAssignment(assignmentResult);
        const executionResult = await getExecution(executionId);
        if (cancelled) return;
        setExecution(executionResult);
        if (!TERMINAL.has(executionResult.status)) {
          setLoading(false);
          if (polls++ < 40) timer = setTimeout(() => void load(), 1500);
          return;
        }
        try {
          const reportResult = await getExecutionReport(executionId);
          if (!cancelled) setReport(reportResult);
        } catch (cause) {
          if (cause instanceof ApiError && cause.status === 410) setExpired(true);
          else if (cause instanceof ApiError && cause.status === 404 && polls++ < 40) {
            setLoading(false);
            timer = setTimeout(() => void load(), 1500);
          }
          else throw cause;
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load execution report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id && executionId) void load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [id, executionId]);

  const status = report?.overallStatus ?? execution?.status ?? "PENDING";
  const verdict = VERDICTS[status];
  const passRate = report?.totalTests ? Math.round((report.passedTests / report.totalTests) * 100) : 0;
  const attempt = searchParams.get("num");
  const peakMemory = reportedMemory(report?.maxMemoryUsedMb, execution?.memoryMb);
  const resources = useMemo(() => ({
    time: Math.min(100, Math.round(((report?.maxExecutionTimeMs ?? execution?.timeMs ?? 0) / Math.max(assignment?.timeLimitMs ?? 1, 1)) * 100)),
    memory: peakMemory == null ? undefined : Math.min(100, Math.round((peakMemory / Math.max(assignment?.memoryLimitMb ?? 1, 1)) * 100)),
  }), [assignment, execution, peakMemory, report]);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="assignments" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Assignments", to: "/assignments" }, { label: assignment?.title ?? "Assignment", to: `/assignment/${id}` }, { label: attempt ? `Attempt #${attempt}` : "Report" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3"><Link to={`/assignment/${id}/submissions`} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow"><ArrowLeft size={14} /> Submission history</Link><div className="flex gap-2"><Link to={`/assignment/${id}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700"><Code2 size={13} /> Workspace</Link><Link to={`/assignment/${id}/submissions`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700"><History size={13} /> History</Link></div></div>

            {loading ? (
              <div className="space-y-5 animate-pulse"><div className="h-40 rounded-2xl bg-gray-100 dark:bg-dark-surface" /><div className="h-80 rounded-2xl bg-gray-100 dark:bg-dark-surface" /></div>
            ) : error ? (
              <StatePanel icon={<AlertCircle size={28} />} title="Could not load report" description={error} />
            ) : expired ? (
              <StatePanel icon={<FileWarning size={28} />} title="Detailed report expired" description="Execution artifacts are retained for 90 days. Verdict and resource summary remain available in submission history." />
            ) : (
              <>
                <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-6 lg:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5"><div className={`w-12 h-12 rounded-xl border grid place-items-center flex-shrink-0 ${verdict.className}`}>{verdict.icon}</div><div className="flex-1"><p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Execution report</p><h1 className="mt-1 text-2xl font-bold">{verdict.label}</h1><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{assignment?.title} · {execution?.executionType === "DEFINITIVE" ? "Definitive submission" : "Practice run"}</p></div>{report && <div className="text-left sm:text-right"><p className="text-3xl font-bold font-mono">{report.passedTests}/{report.totalTests}</p><p className="text-xs text-gray-500">tests passed · {passRate}%</p></div>}</div>
                  {report && <div className="h-2 mt-5 rounded-full bg-gray-200 dark:bg-dark-card overflow-hidden"><div className={`h-full ${verdict.bar}`} style={{ width: `${passRate}%` }} /></div>}
                </section>

                {status === "PENDING" ? <StatePanel icon={<RefreshCw className="animate-spin" size={28} />} title="Evaluation in progress" description="This page updates automatically when worker returns a verdict." /> : report && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4"><ResourceCard icon={<Clock3 size={15} />} label="Peak execution time" value={`${report.maxExecutionTimeMs ?? execution?.timeMs ?? 0}ms`} limit={`${assignment?.timeLimitMs ?? 0}ms limit`} percent={resources.time} /><ResourceCard icon={<HardDrive size={15} />} label="Peak memory" value={peakMemory == null ? "Not reported" : `${peakMemory}MB`} limit={`${assignment?.memoryLimitMb ?? 0}MB limit`} percent={resources.memory} /></div>
                    {report.compilationError && <section className="rounded-2xl border border-yellow/20 bg-yellow/5 overflow-hidden"><header className="px-5 py-3.5 border-b border-yellow/20 flex items-center gap-2 text-sm font-semibold text-yellow"><Code2 size={15} /> Compiler diagnostic</header><pre className="p-5 text-xs leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto text-gray-700 dark:text-gray-300">{report.compilationError}</pre></section>}
                    <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden"><header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60"><h2 className="font-semibold">Test-case results</h2><p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Private inputs and expected outputs stay hidden. Only verdict and resource diagnostics are shown.</p></header><div className="divide-y divide-gray-100 dark:divide-gray-800/60">{report.testCaseResults.map((test) => <TestResultRow key={test.testCaseNumber} test={test} />)}</div></section>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ResourceCard({ icon, label, value, limit, percent }: { icon: React.ReactNode; label: string; value: string; limit: string; percent?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface p-5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold text-gray-400">{icon}{label}</div>
      <div className="mt-2 flex justify-between items-end"><strong className="font-mono text-lg">{value}</strong><span className="text-xs text-gray-500">{limit}</span></div>
      {percent == null ? (
        <p className="mt-3 text-[10px] text-gray-400">Measurement unavailable</p>
      ) : (
        <div className="h-1.5 mt-3 rounded-full bg-gray-100 dark:bg-dark-card overflow-hidden">
          <div className="h-full bg-azure dark:bg-yellow" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}

function TestResultRow({ test }: { test: TestCaseResult }) {
  const config = VERDICTS[test.status];
  const diagnostic = testDiagnostic(test);
  const memory = test.memoryUsedMb != null && test.memoryUsedMb > 0 ? `${test.memoryUsedMb}MB` : "—";
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center gap-4">
        <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-card grid place-items-center text-[10px] font-mono font-bold">{String(test.testCaseNumber).padStart(2, "0")}</span>
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${config.className}`}>{config.label}</span>
        <span className="ml-auto text-[10px] font-mono text-gray-500">{test.executionTimeMs == null ? "—" : `${test.executionTimeMs}ms`} · {memory}</span>
      </div>
      {diagnostic && (
        <details className="mt-3 ml-12 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">{test.status === ExecutionStatus.MLE ? "Memory diagnostic" : "Runtime diagnostic"}</summary>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs font-mono text-red-700 dark:text-red-300">{diagnostic}</pre>
        </details>
      )}
    </div>
  );
}

function StatePanel({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-8 text-center"><div className="mx-auto w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-card text-gray-500 grid place-items-center">{icon}</div><h1 className="mt-4 font-semibold text-lg">{title}</h1><p className="mt-2 max-w-xl mx-auto text-sm text-gray-500 dark:text-gray-400">{description}</p></div>;
}
