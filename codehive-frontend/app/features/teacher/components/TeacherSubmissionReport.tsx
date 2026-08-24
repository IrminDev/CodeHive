import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  FileWarning,
  HardDrive,
  LoaderCircle,
} from "lucide-react";

import {
  ExecutionStatus,
  type ExecutionReport,
  type TestCaseResult,
} from "~/features/student/types/execution.types";
import type { TeacherSubmissionEvidence } from "../types/student-work.types";
import { StatusPill } from "./TeacherUI";

type Tone = "success" | "warning" | "error" | "info" | "neutral";

function reportTone(status?: ExecutionStatus | string): Tone {
  if (status === ExecutionStatus.AC) return "success";
  if (status === ExecutionStatus.PENDING) return "warning";
  return status ? "error" : "neutral";
}

function memory(value?: number): string {
  return value != null && value > 0 ? `${value} MB` : "Not reported";
}

export function TeacherSubmissionReport({
  evidence,
  report,
  loading,
  error,
}: {
  evidence: TeacherSubmissionEvidence | null;
  report: ExecutionReport | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading && !report) {
    return <ReportState icon={<LoaderCircle className="animate-spin" />} title="Loading submission report…" />;
  }
  if (error) {
    return <ReportState icon={<AlertCircle />} title="Could not load submission report" description={error} tone="error" />;
  }
  if (!evidence?.execution) {
    return <ReportState icon={<FileWarning />} title="No execution report" description="Selected submission has no execution evidence." />;
  }
  if (evidence.execution.status === ExecutionStatus.PENDING) {
    return <ReportState icon={<LoaderCircle className="animate-spin" />} title="Evaluation in progress" description="Report becomes available after worker finishes evaluation." />;
  }
  if (!evidence.reportAvailable) {
    return <ReportState icon={<FileWarning />} title="Detailed report expired" description={`Persisted verdict: ${evidence.execution.status}. Resource summary remains available in submission history.`} />;
  }
  if (!report) {
    return <ReportState icon={<FileWarning />} title="Report unavailable" description="Execution finished, but detailed report could not be retrieved." />;
  }

  const passRate = report.totalTests
    ? Math.round((report.passedTests / report.totalTests) * 100)
    : 0;

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-dark-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${report.overallStatus === ExecutionStatus.AC ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
            {report.overallStatus === ExecutionStatus.AC ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Submission report</p>
            <div className="mt-1 flex items-center gap-2">
              <h3 className="text-lg font-semibold">Execution verdict</h3>
              <StatusPill label={report.overallStatus} tone={reportTone(report.overallStatus)} />
            </div>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-2xl font-bold">{report.passedTests}/{report.totalTests}</p>
            <p className="text-[10px] text-gray-500">tests passed · {passRate}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-dark-surface">
          <div className={`h-full rounded-full ${report.overallStatus === ExecutionStatus.AC ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${passRate}%` }} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <ReportMetric icon={<Clock3 size={14} />} label="Peak time" value={report.maxExecutionTimeMs == null ? "Not reported" : `${report.maxExecutionTimeMs} ms`} />
        <ReportMetric icon={<HardDrive size={14} />} label="Peak memory" value={memory(report.maxMemoryUsedMb)} />
        <ReportMetric icon={<AlertCircle size={14} />} label="Failed tests" value={String(report.failedTests)} />
      </div>

      {report.compilationError && (
        <section className="overflow-hidden rounded-xl border border-yellow/30 bg-yellow/5">
          <header className="flex items-center gap-2 border-b border-yellow/20 px-4 py-3 text-xs font-semibold text-yellow">
            <Code2 size={14} /> Compiler diagnostic
          </header>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs text-gray-700 dark:text-gray-300">{report.compilationError}</pre>
        </section>
      )}

      <section>
        <div className="mb-2">
          <h3 className="text-sm font-semibold">Test-case results</h3>
          <p className="mt-0.5 text-[10px] text-gray-500">Open test to inspect resource use and retained diagnostics.</p>
        </div>
        <div className="space-y-2">
          {report.testCaseResults.map((test) => <TestCaseReport key={test.testCaseNumber} test={test} />)}
        </div>
      </section>
    </div>
  );
}

function ReportMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{icon}{label}</p>
      <p className="mt-2 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function TestCaseReport({ test }: { test: TestCaseResult }) {
  const hasDetails = Boolean(
    test.feedback || test.stderr || test.exitCode != null || test.actualOutput != null || test.expectedOutput != null,
  );
  return (
    <details className="group rounded-xl border border-gray-200 dark:border-gray-700">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3">
        <ChevronDown size={14} className="text-gray-400 transition-transform group-open:rotate-180" />
        <span className="flex-1 text-xs font-mono">Test {test.testCaseNumber}</span>
        <span className="hidden text-[10px] font-mono text-gray-500 sm:inline">
          {test.executionTimeMs == null ? "—" : `${test.executionTimeMs} ms`} · {memory(test.memoryUsedMb)}
        </span>
        <StatusPill label={test.status} tone={reportTone(test.status)} />
      </summary>
      <div className="space-y-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
        {!hasDetails && <p className="text-xs text-gray-500">No diagnostic output retained.</p>}
        {test.feedback && <Diagnostic label="Feedback" value={test.feedback} />}
        {test.stderr && <Diagnostic label="Standard error" value={test.stderr} tone="error" />}
        {test.exitCode != null && <p className="text-[10px] font-mono text-gray-500">Exit code: {test.exitCode}</p>}
        {(test.actualOutput != null || test.expectedOutput != null) && (
          <div className="grid gap-3 lg:grid-cols-2">
            <Diagnostic label="Actual output" value={test.actualOutput ?? "Not retained"} />
            <Diagnostic label="Expected output" value={test.expectedOutput ?? "Not retained"} />
          </div>
        )}
      </div>
    </details>
  );
}

function Diagnostic({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "error" }) {
  return (
    <div>
      <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${tone === "error" ? "text-red-500" : "text-gray-500"}`}>{label}</p>
      <pre className={`max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg p-3 font-mono text-xs ${tone === "error" ? "bg-red-500/5 text-red-600 dark:text-red-300" : "bg-gray-50 text-gray-700 dark:bg-dark-card dark:text-gray-300"}`}>{value}</pre>
    </div>
  );
}

function ReportState({ icon, title, description, tone = "neutral" }: { icon: React.ReactNode; title: string; description?: string; tone?: "neutral" | "error" }) {
  return (
    <div className="p-10 text-center">
      <span className={`mx-auto grid h-11 w-11 place-items-center rounded-xl ${tone === "error" ? "bg-red-500/10 text-red-500" : "bg-gray-100 text-gray-500 dark:bg-dark-card"}`}>{icon}</span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-lg text-xs text-gray-500">{description}</p>}
    </div>
  );
}
