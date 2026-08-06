import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  AlertCircle, Bell, BookOpen, CheckCircle2, ChevronRight,
  ClipboardList, Clock, Code2, GraduationCap, Home,
  Moon, Search, Settings, Sun, Users, Zap,
} from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { getAssignment } from "../api/assignment.api";
import { getExecution, getExecutionReport } from "../api/execution.api";
import type { ExecutionDTO, ExecutionReport } from "../types/execution.types";
import { ExecutionStatus, ExecutionType } from "../types/execution.types";
import type { Assignment } from "../types/assignment.types";

/* ── Verdict config ── */

const VERDICT_CONFIG: Record<string, {
  label: string;
  badgeRing: string; badgeText: string; badgeBg: string;
  iconColor: string; iconBg: string;
  barColor: string;
  icon: React.ReactNode;
}> = {
  AC:  {
    label: "Accepted",
    badgeRing: "border-green-500", badgeText: "text-green-400", badgeBg: "bg-green-500/10",
    iconColor: "text-green-400", iconBg: "bg-green-500/10 border-green-500/20",
    barColor: "bg-green-500",
    icon: <CheckCircle2 size={24} />,
  },
  WA:  {
    label: "Wrong Answer",
    badgeRing: "border-red-500", badgeText: "text-red-400", badgeBg: "bg-red-500/10",
    iconColor: "text-red-400", iconBg: "bg-red-500/10 border-red-500/20",
    barColor: "bg-red-500",
    icon: <AlertCircle size={24} />,
  },
  TLE: {
    label: "Time Limit Exceeded",
    badgeRing: "border-orange-500", badgeText: "text-orange-400", badgeBg: "bg-orange-500/10",
    iconColor: "text-orange-400", iconBg: "bg-orange-500/10 border-orange-500/20",
    barColor: "bg-orange-500",
    icon: <Clock size={24} />,
  },
  CE:  {
    label: "Compilation Error",
    badgeRing: "border-yellow-600", badgeText: "text-yellow-500", badgeBg: "bg-yellow-500/10",
    iconColor: "text-yellow-500", iconBg: "bg-yellow-500/10 border-yellow-600/20",
    barColor: "bg-yellow-500",
    icon: <Code2 size={24} />,
  },
  RTE: {
    label: "Runtime Error",
    badgeRing: "border-red-500", badgeText: "text-red-400", badgeBg: "bg-red-500/10",
    iconColor: "text-red-400", iconBg: "bg-red-500/10 border-red-500/20",
    barColor: "bg-red-500",
    icon: <AlertCircle size={24} />,
  },
  MLE: {
    label: "Memory Limit Exceeded",
    badgeRing: "border-purple-500", badgeText: "text-purple-400", badgeBg: "bg-purple-500/10",
    iconColor: "text-purple-400", iconBg: "bg-purple-500/10 border-purple-500/20",
    barColor: "bg-purple-500",
    icon: <Zap size={24} />,
  },
  PENDING: {
    label: "Pending",
    badgeRing: "border-gray-500", badgeText: "text-gray-400", badgeBg: "bg-gray-500/10",
    iconColor: "text-gray-400", iconBg: "bg-gray-500/10 border-gray-500/20",
    barColor: "bg-gray-500",
    icon: <Clock size={24} />,
  },
};

const TC_VERDICT: Record<string, { ring: string; text: string; bg: string }> = {
  AC:  { ring: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/10" },
  WA:  { ring: "border-red-500",    text: "text-red-400",    bg: "bg-red-500/10" },
  TLE: { ring: "border-orange-500", text: "text-orange-400", bg: "bg-orange-500/10" },
  CE:  { ring: "border-yellow-600", text: "text-yellow-500", bg: "bg-yellow-500/10" },
  RTE: { ring: "border-red-500",    text: "text-red-400",    bg: "bg-red-500/10" },
  MLE: { ring: "border-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
};

/* ── Mock data ── */

function buildMockReport(executionId: string): ExecutionReport {
  return {
    executionId,
    overallStatus: ExecutionStatus.WA,
    testCaseResults: [
      { testCaseNumber: 1, status: ExecutionStatus.AC,  executionTimeMs: 12, memoryUsedMb: 12.1 },
      { testCaseNumber: 2, status: ExecutionStatus.AC,  executionTimeMs: 14, memoryUsedMb: 12.4 },
      { testCaseNumber: 3, status: ExecutionStatus.AC,  executionTimeMs: 11, memoryUsedMb: 11.8 },
      { testCaseNumber: 4, status: ExecutionStatus.WA,  executionTimeMs: 15, memoryUsedMb: 14.2 },
      { testCaseNumber: 5, status: ExecutionStatus.AC,  executionTimeMs: 13, memoryUsedMb: 12.0 },
      { testCaseNumber: 6, status: ExecutionStatus.AC,  executionTimeMs: 12, memoryUsedMb: 11.9 },
      { testCaseNumber: 7, status: ExecutionStatus.AC,  executionTimeMs: 18, memoryUsedMb: 13.3 },
      { testCaseNumber: 8, status: ExecutionStatus.AC,  executionTimeMs: 16, memoryUsedMb: 12.7 },
    ],
    totalTests: 8,
    passedTests: 7,
    failedTests: 1,
    totalExecutionTimeMs: 182,
    maxExecutionTimeMs: 3000,
    maxMemoryUsedMb: 14.2,
  };
}

function buildMockExecution(executionId: string): ExecutionDTO {
  return {
    id: executionId,
    executionType: ExecutionType.DEFINITIVE,
    status: ExecutionStatus.WA,
    createdAt: new Date(Date.now() - 2 * 86400000 + 2 * 3600000).toISOString(),
  };
}

/* ── Page ── */

export function ExecutionReportPage() {
  const { id, executionId } = useParams<{ id: string; executionId: string }>();
  const [params] = useSearchParams();
  const submissionNum = params.get("num");

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [execution, setExecution] = useState<ExecutionDTO | null>(null);
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(" ")[0] ?? "ST";

  useEffect(() => {
    if (!id || !executionId) return;
    Promise.all([
      getAssignment(id).catch(() => null),
      getExecution(executionId).catch(() => (import.meta.env.DEV ? buildMockExecution(executionId) : null)),
      getExecutionReport(executionId).catch(() => (import.meta.env.DEV ? buildMockReport(executionId) : null)),
    ]).then(([a, exec, rep]) => {
      setAssignment(a);
      setExecution(exec);
      setReport(rep);
    }).finally(() => setLoading(false));
  }, [id, executionId]);

  const status = report?.overallStatus ?? execution?.status ?? ExecutionStatus.PENDING;
  const verdict = VERDICT_CONFIG[status] ?? VERDICT_CONFIG.PENDING;
  const shortExecId = executionId ? executionId.replace(/-/g, "").slice(0, 8) : "—";
  const passRate = report ? (report.passedTests / report.totalTests) * 100 : 0;

  function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">

      {/* ── Icon Sidebar ── */}
      <aside className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 bg-gray-50 dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800/60">
        <Link to="/" className="mb-4 flex-shrink-0">
          <div
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            className="w-9 h-9 bg-yellow flex items-center justify-center"
          >
            <span className="text-dark-bg font-bold text-sm leading-none">&lt;/&gt;</span>
          </div>
        </Link>

        <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
          <SidebarIcon icon={<Home size={20} />}          label="Dashboard"   to="/dashboard" />
          <SidebarIcon icon={<Users size={20} />}         label="Groups"      to="/groups" />
          <SidebarIcon icon={<BookOpen size={20} />}      label="Courses"     to="/courses" />
          <SidebarIcon icon={<GraduationCap size={20} />} label="Grades"      to="/grades" />
          <SidebarIcon icon={<ClipboardList size={20} />} label="Assignments" to="/assignments" active />
        </nav>

        <div className="flex flex-col items-center gap-2 w-full px-2">
          <SidebarIcon icon={<Settings size={20} />} label="Settings" to="/settings" />
          <div
            title={user?.name}
            className="w-9 h-9 rounded-full bg-azure flex items-center justify-center text-xs font-bold text-white"
          >
            {firstName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <header className="h-12 flex-shrink-0 flex items-center gap-4 px-5 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800/60">
          <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
            <span className="text-gray-400 dark:text-gray-500">Student</span>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
            <Link
              to={`/assignment/${id}`}
              className="text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors max-w-[160px] truncate"
            >
              {assignment?.title ?? "Assignment"}
            </Link>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {submissionNum ? `Submission #${submissionNum}` : "Execution Report"}
            </span>
          </div>

          <div className="flex-1 max-w-sm mx-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700/60">
              <Search size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search assignments, groups..."
                className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono border border-gray-200 dark:border-gray-700 rounded px-1 flex-shrink-0">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <Bell size={18} />
            </button>
            <button onClick={toggleTheme} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-8 py-7 gap-5">

            {loading ? (
              <div className="space-y-4">
                <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-dark-card animate-pulse" />
                <div className="h-28 rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse" />
                <div className="flex gap-5 flex-1">
                  <div className="flex-1 rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse" />
                  <div className="w-72 rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-5 min-h-0">
                {/* ── Page title row ── */}
                <div className="flex items-start gap-4">
                  <Link
                    to={`/assignment/${id}/submissions`}
                    className="mt-1 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full border border-yellow/40 bg-yellow/5 text-yellow text-[10px] font-semibold uppercase tracking-widest mb-2">
                      Execution Report
                    </span>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {submissionNum ? `Submission #${submissionNum}` : "Execution Report"}
                    </h1>
                  </div>
                </div>

                {/* ── Summary card (full width) ── */}
                <div className="flex-shrink-0 rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 overflow-hidden">
                  {/* Top row: verdict + counter */}
                  <div className="flex items-center gap-6 px-6 py-5">
                    <div className={`w-12 h-12 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${verdict.iconBg} ${verdict.iconColor}`}>
                      {verdict.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-gray-900 dark:text-white">{verdict.label}</span>
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono ${verdict.badgeRing} ${verdict.badgeText} ${verdict.badgeBg}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        exec_id: {shortExecId}
                        {execution?.createdAt ? ` · submitted ${formatDate(execution.createdAt)}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 pl-6 border-l border-gray-200 dark:border-gray-700/60">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{report?.passedTests ?? "—"}</span>
                        <span className="text-lg text-gray-400 dark:text-gray-500 font-mono">/{report?.totalTests ?? "—"}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">Tests passed</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-dark-card overflow-hidden">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${passRate}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0">
                        {report?.passedTests ?? 0}/{report?.totalTests ?? 0} passed
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800/60">
                    <div className="px-6 py-4 border-r border-gray-100 dark:border-gray-800/60">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1">Total time</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                          {report?.totalExecutionTimeMs != null ? `${report.totalExecutionTimeMs}ms` : "—"}
                        </span>
                        {report?.maxExecutionTimeMs != null && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">/{report.maxExecutionTimeMs}ms</span>
                        )}
                      </div>
                      {report?.totalExecutionTimeMs != null && report?.maxExecutionTimeMs != null && (
                        <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-dark-card overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min((report.totalExecutionTimeMs / report.maxExecutionTimeMs) * 100, 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-4 border-r border-gray-100 dark:border-gray-800/60">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1">Peak memory</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                          {report?.maxMemoryUsedMb != null ? `${report.maxMemoryUsedMb}MB` : "—"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">/512MB</span>
                      </div>
                      {report?.maxMemoryUsedMb != null && (
                        <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-dark-card overflow-hidden">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min((report.maxMemoryUsedMb / 512) * 100, 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-4">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1">Exit code</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                          {status === ExecutionStatus.AC || status === ExecutionStatus.WA ? "0" : "—"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">normal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CE error ── */}
                {status === ExecutionStatus.CE && report?.compilationError && (
                  <div className="flex-shrink-0 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-600/20">
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-500 uppercase tracking-widest font-semibold mb-2">
                      Compilation Error
                    </p>
                    <pre className="text-xs text-yellow-700 dark:text-yellow-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {report.compilationError}
                    </pre>
                  </div>
                )}

                {/* ── Two-column body ── */}
                <div className="flex gap-5 flex-1 min-h-0">

                  {/* Left: test cases (scrollable) */}
                  <div className="flex-1 min-w-0 rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 overflow-hidden flex flex-col">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 dark:border-gray-800/60 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Test case results</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 uppercase tracking-widest">time</span>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 uppercase tracking-widest ml-10">memory</span>
                      </div>
                    </div>

                    {/* Rows */}
                    <div className="overflow-y-auto scrollbar-hide flex-1">
                      {report?.testCaseResults.map((tc, i) => {
                        const tcStyle = TC_VERDICT[tc.status] ?? TC_VERDICT.WA;
                        const isLast = i === (report.testCaseResults.length - 1);
                        const maxTime = report.maxExecutionTimeMs ?? 3000;
                        const barPct = tc.executionTimeMs != null ? Math.min((tc.executionTimeMs / maxTime) * 100, 100) : 0;
                        return (
                          <div
                            key={tc.testCaseNumber}
                            className={`flex items-center gap-5 px-6 py-3.5 hover:bg-gray-100/50 dark:hover:bg-dark-card/40 transition-colors ${!isLast ? "border-b border-gray-100 dark:border-gray-800/40" : ""}`}
                          >
                            <span className="w-16 text-sm font-mono text-gray-500 dark:text-gray-400 flex-shrink-0">
                              case {String(tc.testCaseNumber).padStart(2, "0")}
                            </span>
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-[10px] font-bold font-mono flex-shrink-0 ${tcStyle.ring} ${tcStyle.text} ${tcStyle.bg}`}>
                              {tc.status}
                            </span>
                            {/* Time mini-bar */}
                            <div className="flex-1 flex items-center gap-3">
                              <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-dark-card overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${tc.status === ExecutionStatus.AC ? "bg-green-500/50" : "bg-red-500/50"}`}
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-12 text-right flex-shrink-0">
                                {tc.executionTimeMs != null ? `${tc.executionTimeMs}ms` : "—"}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-16 text-right flex-shrink-0">
                              {tc.memoryUsedMb != null ? `${tc.memoryUsedMb}MB` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right sidebar */}
                  <div className="w-72 flex-shrink-0 flex flex-col gap-4">

                    {/* Info + actions combined */}
                    <div className="rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 overflow-hidden flex-shrink-0">
                      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800/60">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Submission info</span>
                      </div>
                      <div className="px-5 py-4 space-y-2.5">
                        <InfoRow label="Assignment" value={assignment?.title ?? "—"} />
                        <InfoRow label="Attempt" value={submissionNum ? `#${submissionNum}` : "—"} mono />
                        <InfoRow label="Submitted" value={execution?.createdAt ? formatDate(execution.createdAt) : "—"} mono />
                      </div>
                      <div className="px-4 pb-4 pt-1 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800/60">
                        <Link
                          to={`/assignment/${id}`}
                          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-yellow text-dark-bg text-xs font-semibold hover:bg-yellow/90 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                          </svg>
                          Open in editor
                        </Link>
                        <Link
                          to={`/assignment/${id}/submissions`}
                          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 transition-all"
                        >
                          <ClipboardList size={15} />
                          All submissions
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SidebarIcon({ icon, label, to, active = false }: {
  icon: React.ReactNode; label: string; to: string; active?: boolean;
}) {
  return (
    <Link
      to={to}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
        active
          ? "text-yellow bg-yellow/10"
          : "text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card"
      }`}
    >
      {icon}
    </Link>
  );
}


function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-[11px] text-gray-700 dark:text-gray-300 text-right truncate ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}
