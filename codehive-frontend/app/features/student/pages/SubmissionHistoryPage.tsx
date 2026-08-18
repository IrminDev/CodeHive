import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  Bell, BookOpen, ChevronRight, ClipboardList,
  GraduationCap, Home, Moon, Search, Settings, Sun, Target, Users,
} from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { getAssignment } from "../api/assignment.api";
import { listSubmissions } from "../api/execution.api";
import type { Assignment } from "../types/assignment.types";
import type { Submission } from "../types/execution.types";
import { ExecutionStatus } from "../types/execution.types";

/* ── Helpers ── */

function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatCountdown(closeDate: string): string {
  const diff = new Date(closeDate).getTime() - Date.now();
  if (diff <= 0) return "closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return days > 0 ? `${days}d ${String(hours).padStart(2, "0")}h` : `${hours}h`;
}

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const VERDICT_STYLES: Record<string, { ring: string; text: string; bg: string }> = {
  AC:  { ring: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/10" },
  WA:  { ring: "border-red-500",    text: "text-red-400",    bg: "bg-red-500/10" },
  TLE: { ring: "border-orange-500", text: "text-orange-400", bg: "bg-orange-500/10" },
  CE:  { ring: "border-yellow-600", text: "text-yellow-500", bg: "bg-yellow-500/10" },
  RTE: { ring: "border-red-500",    text: "text-red-400",    bg: "bg-red-500/10" },
  MLE: { ring: "border-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
  OLE: { ring: "border-pink-500",   text: "text-pink-400",   bg: "bg-pink-500/10" },
};

/* ── Mock data (DEV fallback) ── */

function buildMockSubmissions(assignmentId: string): Submission[] {
  const base = Date.now();
  return [
    { id: "s14", submissionNumber: 14, assignmentId, language: "python", status: ExecutionStatus.WA,  passedTests: 7, totalTests: 8, createdAt: new Date(base - 2 * 86400000 + 2 * 3600000).toISOString(), isLate: false },
    { id: "s13", submissionNumber: 13, assignmentId, language: "python", status: ExecutionStatus.TLE, passedTests: 5, totalTests: 8, createdAt: new Date(base - 2 * 86400000 + 1 * 3600000).toISOString(), isLate: false },
    { id: "s12", submissionNumber: 12, assignmentId, language: "python", status: ExecutionStatus.WA,  passedTests: 6, totalTests: 8, createdAt: new Date(base - 3 * 86400000).toISOString(), isLate: false },
    { id: "s11", submissionNumber: 11, assignmentId, language: "java",   status: ExecutionStatus.CE,  passedTests: 0, totalTests: 8, createdAt: new Date(base - 4 * 86400000).toISOString(), isLate: false },
    { id: "s10", submissionNumber: 10, assignmentId, language: "python", status: ExecutionStatus.AC,  passedTests: 8, totalTests: 8, createdAt: new Date(base - 8 * 86400000).toISOString(), isLate: true  },
  ];
}

/* ── Page ── */

export function SubmissionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(" ")[0] ?? "ST";

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getAssignment(id).catch(() => null),
      listSubmissions(id).catch(() => (import.meta.env.DEV ? buildMockSubmissions(id) : [])),
    ]).then(([a, subs]) => {
      setAssignment(a);
      setSubmissions(subs);
    }).finally(() => setLoading(false));
  }, [id]);

  const latest = submissions[0] ?? null;
  const now = new Date();
  const isClosed = assignment?.closeDate ? new Date(assignment.closeDate) < now : false;
  const isLate = !isClosed && !!assignment?.dueDate && new Date(assignment.dueDate) < now;

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
          <SidebarIcon icon={<Home size={20} />}         label="Dashboard"   to="/dashboard" />
          <SidebarIcon icon={<Users size={20} />}        label="Groups"      to="/groups" />
          <SidebarIcon icon={<BookOpen size={20} />}     label="Courses"     to="/courses" />
          <SidebarIcon icon={<GraduationCap size={20} />} label="Grades"    to="/grades" />
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
            <span className="text-gray-900 dark:text-gray-100 font-medium">Submissions</span>
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
        <main className="flex-1 overflow-y-auto scrollbar-hide px-8 py-7">

          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-dark-card animate-pulse" />
              <div className="h-12 w-96 rounded-lg bg-gray-100 dark:bg-dark-card animate-pulse" />
              <div className="h-24 rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse mt-6" />
              <div className="h-64 rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse" />
            </div>
          ) : (
            <>
              {/* ── Page title row ── */}
              <div className="flex items-start justify-between gap-6 mb-7">
                <div className="flex items-start gap-4">
                  {/* Back button */}
                  <Link
                    to={`/assignment/${id}`}
                    className="mt-1 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>

                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full border border-yellow/40 bg-yellow/5 text-yellow text-[10px] font-semibold uppercase tracking-widest mb-2">
                      Submission History
                    </span>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">
                      {assignment?.title ?? "Assignment"}
                    </h1>
                  </div>
                </div>

                {/* Countdown */}
                <div className="text-right flex-shrink-0 space-y-1">
                  {assignment?.closeDate && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                        {isClosed ? "closed" : "closes in"}
                      </p>
                      <p className={`text-xl font-bold font-mono ${isClosed ? "text-red-400" : "text-yellow"}`}>
                        {isClosed ? "—" : formatCountdown(assignment.closeDate)}
                      </p>
                    </div>
                  )}
                  {assignment?.dueDate && (
                    <p className={`text-xs font-mono ${isLate ? "text-orange-400" : "text-gray-400 dark:text-gray-500"}`}>
                      {isLate ? "late — " : "due "}
                      {formatDue(assignment.dueDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Latest submission card ── */}
              {latest && (
                <div className="flex items-center gap-5 p-5 rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 mb-5">
                  {/* Icon */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <Target size={22} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Latest: Submission #{latest.submissionNumber}
                      </span>
                      <VerdictBadge status={latest.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {latest.passedTests}/{latest.totalTests} test cases passed
                      {" · "}submitted {formatSubmittedAt(latest.createdAt)}
                      {" · "}{latest.language}
                    </p>
                  </div>

                  {/* Open in editor */}
                  <Link
                    to={`/assignment/${id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-azure dark:hover:border-yellow transition-all flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                    Open in editor
                  </Link>
                </div>
              )}

              {/* ── All submissions table ── */}
              <div className="rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 overflow-hidden">
                {/* Table header */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 dark:border-gray-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">All submissions</span>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-dark-card text-xs font-mono text-gray-500 dark:text-gray-400">
                      {submissions.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">
                    multiple attempts allowed until close
                  </span>
                </div>

                {/* Column labels */}
                <div className="grid grid-cols-[56px_1fr_120px_100px_80px_120px_140px] px-6 py-2 border-b border-gray-100 dark:border-gray-800/40">
                  {["#", "SUBMITTED", "LANGUAGE", "VERDICT", "SCORE", "FLAGS", ""].map((col) => (
                    <span key={col} className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 font-mono">
                      {col}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {submissions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-600">
                    No submissions yet.
                  </div>
                ) : (
                  submissions.map((sub, i) => (
                    <SubmissionRow
                      key={sub.id}
                      submission={sub}
                      isLatest={i === 0}
                      isLast={i === submissions.length - 1}
                    />
                  ))
                )}

                {/* Footer note */}
                <div className="flex items-start gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800/40">
                  <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
                    Your most recent submission before close counts for grading. Submissions after the due date are permanently flagged as late.
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SidebarIcon({
  icon, label, to, active = false,
}: {
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

function VerdictBadge({ status }: { status: string }) {
  const style = VERDICT_STYLES[status] ?? { ring: "border-gray-500", text: "text-gray-400", bg: "bg-gray-500/10" };
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono ${style.ring} ${style.text} ${style.bg}`}>
      {status}
    </span>
  );
}

function SubmissionRow({
  submission: sub,
  isLatest,
  isLast,
}: {
  submission: Submission;
  isLatest: boolean;
  isLast: boolean;
}) {
  return (
    <div className={`grid grid-cols-[56px_1fr_120px_100px_80px_120px_140px] items-center px-6 py-3.5 hover:bg-gray-100/50 dark:hover:bg-dark-card/40 transition-colors ${!isLast ? "border-b border-gray-100 dark:border-gray-800/40" : ""}`}>
      {/* # */}
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">
        #{sub.submissionNumber}
      </span>

      {/* Submitted */}
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {formatSubmittedAt(sub.createdAt)}
      </span>

      {/* Language */}
      <span className="text-sm text-gray-600 dark:text-gray-400 lowercase">
        {sub.language}
      </span>

      {/* Verdict */}
      <div>
        <VerdictBadge status={sub.status} />
      </div>

      {/* Score */}
      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
        {sub.passedTests}/{sub.totalTests}
      </span>

      {/* Flags */}
      <div className="flex items-center gap-1.5">
        {isLatest && (
          <span className="text-[10px] font-mono font-medium text-yellow">latest</span>
        )}
        {sub.isLate && (
          <span className="text-[10px] font-mono font-medium text-orange-400">late</span>
        )}
      </div>

      {/* View report */}
      <Link
        to={`/assignment/${sub.assignmentId}/report/${sub.executionId ?? sub.id}?num=${sub.submissionNumber}`}
        className="text-[11px] font-mono text-yellow hover:text-gold transition-colors text-right block"
      >
        view report →
      </Link>
    </div>
  );
}
