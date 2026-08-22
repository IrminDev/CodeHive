import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CircleAlert, Clock3, FileClock, Gauge, HardDrive, History, RotateCcw } from "lucide-react";

import { getAssignment } from "../api/assignment.api";
import { listAssignmentSubmissions } from "../api/submission.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { Assignment } from "../types/assignment.types";
import type { ExecutionStatus, StudentSubmissionHistory } from "../types/execution.types";

const VERDICTS: Record<ExecutionStatus, { label: string; className: string }> = {
  AC: { label: "Accepted", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  WA: { label: "Wrong answer", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  TLE: { label: "Time limit", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  MLE: { label: "Memory limit", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  OLE: { label: "Output limit", className: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
  RTE: { label: "Runtime error", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  CE: { label: "Compilation error", className: "bg-yellow/10 text-yellow border-yellow/20" },
  PENDING: { label: "Evaluating", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}

export function SubmissionHistoryPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmissionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setLoading(true);
    Promise.all([getAssignment(id), listAssignmentSubmissions(id)])
      .then(([assignmentResult, submissionResult]) => {
        if (cancelled) return;
        setAssignment(assignmentResult);
        setSubmissions(submissionResult);
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load submission history."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const accepted = submissions.filter((submission) => submission.executionStatus === "AC").length;
  const latest = submissions[0];

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="assignments" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Assignments", to: "/assignments" }, { label: assignment?.title ?? "History", to: `/assignment/${id}` }, { label: "Submissions" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6 pb-8">
            <Link to={`/assignment/${id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow"><ArrowLeft size={14} /> Back to assignment</Link>

            {loading ? (
              <div className="space-y-5 animate-pulse"><div className="h-32 rounded-2xl bg-gray-100 dark:bg-dark-surface" /><div className="h-80 rounded-2xl bg-gray-100 dark:bg-dark-surface" /></div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert className="mx-auto text-red-500" size={28} /><h1 className="mt-3 font-semibold">Could not load history</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p></div>
            ) : (
              <>
                <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-6 lg:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div><div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow text-[10px] font-semibold uppercase tracking-wide"><History size={12} /> Submission history</div><h1 className="mt-3 text-3xl font-bold">{assignment?.title ?? "Assignment"}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Persisted verdicts remain visible after detailed execution artifacts expire.</p></div>
                    <Link to={`/assignment/${id}`} className="inline-flex self-start items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french"><RotateCcw size={13} /> Open workspace</Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <Metric label="Attempts" value={String(submissions.length)} />
                    <Metric label="Accepted" value={String(accepted)} />
                    <Metric label="Latest verdict" value={latest ? VERDICTS[latest.executionStatus].label : "No attempts"} />
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden">
                  <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60"><h2 className="font-semibold">All attempts</h2><p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Newest first. Withdrawn attempts remain part of history.</p></header>
                  {submissions.length === 0 ? (
                    <div className="py-16 px-5 text-center"><FileClock className="mx-auto text-gray-300 dark:text-gray-700" size={30} /><h3 className="mt-3 text-sm font-semibold">No submissions yet</h3><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Run tests, then submit from assignment workspace.</p></div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {submissions.map((submission, index) => {
                        const attempt = submissions.length - index;
                        const verdict = VERDICTS[submission.executionStatus];
                        return (
                          <article key={submission.submissionId} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-card grid place-items-center flex-shrink-0 font-mono text-xs font-bold text-gray-500">#{attempt}</div>
                            <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${verdict.className}`}>{verdict.label}</span>{submission.submissionStatus === "WITHDRAWN" && <span className="px-2 py-0.5 rounded-full border border-gray-500/20 bg-gray-500/10 text-gray-500 text-[10px] font-semibold">Withdrawn</span>}{submission.deliveredLate && <span className="text-[10px] font-medium text-orange-500">Late</span>}</div><p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{submission.language} · {formatDate(submission.submittedAt)}</p></div>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 dark:text-gray-400"><span className="inline-flex items-center gap-1"><Clock3 size={11} /> {submission.timeMs == null ? "—" : `${submission.timeMs}ms`}</span><span className="inline-flex items-center gap-1"><HardDrive size={11} /> {submission.memoryMb == null ? "—" : `${submission.memoryMb}MB`}</span></div>
                            {submission.executionId && submission.reportAvailable ? <Link to={`/assignment/${id}/report/${submission.executionId}?num=${attempt}`} className="inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 hover:text-azure dark:hover:text-yellow"><Gauge size={13} /> View report</Link> : <span className="text-xs text-gray-400 dark:text-gray-600 md:w-24 md:text-right">{submission.executionStatus === "PENDING" ? "Processing…" : "Report expired"}</span>}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card px-4 py-3"><p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">{label}</p><p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{value}</p></div>;
}
