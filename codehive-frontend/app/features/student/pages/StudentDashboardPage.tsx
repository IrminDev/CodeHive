import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  CheckCircle2, ChevronRight, Clock, HardDrive, Plus, RefreshCw,
} from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { listMyGroups } from "../api/group.api";
import { listMyAssignmentOverviews } from "../api/assignment.api";
import { listRecentSubmissions } from "../api/submission.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { Assignment, Language } from "../types/assignment.types";
import type { ClassGroup } from "../types/group.types";
import type { GroupSubmission } from "../types/group-submission.types";
import type { RecentSubmission, SubmissionResultStatus } from "../types/submission.types";
import { assignmentProgress, type AssignmentProgress } from "../utils/assignment-progress";

const LANG_ABBR: Record<Language, string> = {
  PYTHON: "PY",
  JAVA: "JAVA",
  CPP: "C++",
  C: "C",
};

type FilterTab = "all" | "open" | "inprogress" | "done";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getSemesterBadge(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const season = month < 5 ? "SPRING" : month < 8 ? "SUMMER" : "FALL";
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7);
  return `${season} ${year} · WEEK ${week}`;
}

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const VERDICT_STYLES: Record<SubmissionResultStatus, { bg: string; text: string }> = {
  AC:  { bg: "bg-green-500/15",  text: "text-green-400" },
  WA:  { bg: "bg-red-500/15",   text: "text-red-400" },
  TLE: { bg: "bg-orange-500/15", text: "text-orange-400" },
  CE:  { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  RTE: { bg: "bg-red-500/15",   text: "text-red-400" },
  MLE: { bg: "bg-purple-500/15", text: "text-purple-400" },
  OLE: { bg: "bg-pink-500/15", text: "text-pink-400" },
  PENDING: { bg: "bg-yellow/15", text: "text-yellow" },
};

const GROUP_BADGE_COLORS = [
  { bg: "bg-azure", text: "text-white" },
  { bg: "bg-french", text: "text-white" },
  { bg: "bg-yellow", text: "text-dark-bg" },
];

function formatRelativeTime(value: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function StudentDashboardPage() {
  const { user } = useAuth();

  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [submissions, setSubmissions] = useState<RecentSubmission[]>([]);
  const [currentSubmissions, setCurrentSubmissions] = useState<GroupSubmission[]>([]);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoadingGroups(true);
    setLoadingAssignments(true);
    setLoadingSubmissions(true);
    setAssignmentError(null);
    try {
      const groupItems = (await listMyGroups()).filter((group) => group.isActive && !group.archived);
      setGroups(groupItems);
      const [assignmentResult, submissionResult] = await Promise.allSettled([
        listMyAssignmentOverviews(),
        listRecentSubmissions(),
      ]);
      setAssignments(assignmentResult.status === "fulfilled" ? assignmentResult.value.map((item) => item.assignment) : []);
      if (assignmentResult.status === "rejected") {
        setAssignmentError(assignmentResult.reason instanceof Error ? assignmentResult.reason.message : "Could not load assignments.");
      }
      setSubmissions(submissionResult.status === "fulfilled" ? submissionResult.value : []);
      setCurrentSubmissions(assignmentResult.status === "fulfilled" ? assignmentResult.value.flatMap((item) => item.currentSubmission ? [item.currentSubmission] : []) : []);
    } catch {
      setGroups([]);
      setAssignments([]);
      setSubmissions([]);
      setCurrentSubmissions([]);
      setAssignmentError("Could not load dashboard assignments.");
    } finally {
      setLoadingGroups(false);
      setLoadingAssignments(false);
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const totalPending = groups.filter((g) => g.isActive && !g.archived).length;
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const submissionByAssignment = useMemo(
    () => new Map(currentSubmissions.map((submission) => [submission.assignmentId, submission])),
    [currentSubmissions],
  );

  const filteredAssignments = useMemo(() => {
    if (filterTab === "open") return assignments.filter((assignment) => assignmentProgress(assignment, submissionByAssignment.get(assignment.id)) === "open");
    if (filterTab === "inprogress") return assignments.filter((assignment) => assignmentProgress(assignment, submissionByAssignment.get(assignment.id)) === "inprogress");
    if (filterTab === "done") return assignments.filter((assignment) => assignmentProgress(assignment, submissionByAssignment.get(assignment.id)) === "done");
    return assignments;
  }, [assignments, filterTab, submissionByAssignment]);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">

      <StudentSidebar active="dashboard" />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Dashboard" }]} />

        {/* ── Content ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Main column ── */}
          <main className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-5 min-w-0">

            {/* Greeting */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
                  {getSemesterBadge()}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
                  {getGreeting()},{" "}
                  <span className="text-azure dark:text-azure">{firstName}</span>.
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You are enrolled in{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totalPending} active {totalPending === 1 ? "group" : "groups"}
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                <button onClick={() => void loadDashboard()} disabled={loadingGroups || loadingAssignments || loadingSubmissions} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all disabled:opacity-50">
                  <RefreshCw size={13} />
                  Sync
                </button>
                <Link to="/groups/join" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french transition-colors">
                  <Plus size={13} />
                  Join class
                </Link>
              </div>
            </div>

            {/* Assignments panel */}
            <div id="assignments" className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Available assignments</span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-dark-card text-xs font-mono text-gray-500 dark:text-gray-400">
                    {assignments.length}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {(["all", "open", "inprogress", "done"] as FilterTab[]).map((tab) => {
                    const labels: Record<FilterTab, string> = {
                      all: "All",
                      open: "Open",
                      inprogress: "In progress",
                      done: "Done",
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => setFilterTab(tab)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          filterTab === tab
                            ? "text-yellow"
                            : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rows */}
              {loadingAssignments ? (
                <div className="p-4 space-y-2">
                  {[0, 1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-xl bg-gray-100 dark:bg-dark-card animate-pulse" />
                  ))}
                </div>
              ) : assignmentError ? (
                <div className="py-12 px-5 text-center"><p className="text-sm text-red-500">{assignmentError}</p><button onClick={() => void loadDashboard()} className="mt-3 text-xs font-semibold text-azure dark:text-yellow">Try again</button></div>
              ) : filteredAssignments.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-600">
                  No assignments found.
                </div>
              ) : (
                filteredAssignments.slice(0, 8).map((a, i) => (
                  <AssignmentRow key={a.id} assignment={a} submission={submissionByAssignment.get(a.id)} index={i} />
                ))
              )}

              {/* Footer */}
              {!loadingAssignments && assignments.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800/60 text-xs text-gray-400 dark:text-gray-500">
                  <span>Showing {Math.min(filteredAssignments.length, 8)} of {assignments.length}</span>
                  <Link
                    to="/assignments"
                    className="flex items-center gap-0.5 text-yellow hover:text-gold transition-colors font-medium"
                  >
                    View all <ChevronRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </main>

          {/* ── Right sidebar ── */}
          <aside className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-800/60 overflow-y-auto scrollbar-hide p-5 space-y-6 bg-white dark:bg-dark-bg">

            {/* My groups */}
            <div id="groups">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">My groups</span>
                <Link to="/groups" className="text-xs text-yellow hover:text-gold transition-colors font-medium">View all</Link>
              </div>
              <div className="space-y-0.5">
                {loadingGroups ? (
                  [0, 1, 2].map((n) => (
                    <div key={n} className="h-14 rounded-xl bg-gray-100 dark:bg-dark-card animate-pulse mb-1" />
                  ))
                ) : groups.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-600 py-4 text-center">No groups yet.</p>
                ) : (
                  groups.map((group, i) => (
                    <GroupRow key={group.id} group={group} colorIndex={i} />
                  ))
                )}
              </div>
            </div>

            {/* Recent submissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Recent submissions</span>
              </div>
              {loadingSubmissions ? (
                <div className="space-y-1">{[0, 1, 2].map((item) => <div key={item} className="h-14 rounded-xl bg-gray-100 dark:bg-dark-card animate-pulse" />)}</div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-xs text-gray-400 dark:text-gray-600">
                  No submissions yet.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {submissions.map((s) => (
                    <SubmissionRow key={s.id} submission={s} />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function AssignmentRow({ assignment, submission, index }: { assignment: Assignment; submission?: GroupSubmission; index: number }) {
  const now = new Date();
  const isPastClose = !!assignment.closeDate && new Date(assignment.closeDate) < now;
  const isPastDue = !isPastClose && !!assignment.dueDate && new Date(assignment.dueDate) < now;

  const progress = assignmentProgress(assignment, submission);
  const stateBadges: Record<AssignmentProgress, { label: string; className: string; accepted?: boolean }> = {
    done: { label: "done", className: "bg-green-500/10 text-green-500 border-green-500/20", accepted: true },
    inprogress: { label: "in progress", className: "bg-azure/10 text-azure dark:text-yellow border-azure/20 dark:border-yellow/20" },
    open: { label: "open", className: "bg-azure/10 text-azure dark:text-yellow border-azure/20 dark:border-yellow/20" },
    closed: { label: "closed", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    upcoming: { label: "upcoming", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  };
  const stateBadge = stateBadges[progress];

  return (
    <Link
      to={`/assignment/${assignment.id}`}
      className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors group last:border-b-0"
    >
      {/* Hexagon number */}
      <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full text-gray-300 dark:text-gray-700" viewBox="0 0 36 36" fill="none">
          <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="text-[10px] font-bold font-mono text-gray-500 dark:text-gray-400 relative z-10">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate group-hover:text-azure dark:group-hover:text-yellow transition-colors">
            {assignment.title}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border flex-shrink-0 ${stateBadge.className}`}>
            {stateBadge.accepted && <CheckCircle2 size={11} />}{stateBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {assignment.timeLimitMs}ms
          </span>
          <span className="flex items-center gap-1">
            <HardDrive size={10} />
            {assignment.memoryLimitMb}MB
          </span>
        </div>
      </div>

      {/* Language tags */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {assignment.allowedLanguages.slice(0, 3).map((lang) => (
          <span
            key={lang}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400"
          >
            {LANG_ABBR[lang] ?? lang}
          </span>
        ))}
      </div>

      {/* Due date */}
      <div className="flex-shrink-0 w-20 text-right">
        {assignment.dueDate ? (
          <span className={`text-xs font-medium ${isPastDue ? "text-orange-400" : isPastClose ? "text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            Due {formatDue(assignment.dueDate)}
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
    </Link>
  );
}

function SubmissionRow({ submission: s }: { submission: RecentSubmission }) {
  const style = VERDICT_STYLES[s.executionStatus];
  return (
    <Link to={`/assignment/${s.assignmentId}/submissions`} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card/60 transition-colors group">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${style.bg} ${style.text}`}>
        {s.executionStatus}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.assignmentTitle}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
          {s.language.toLowerCase()}{s.timeMs != null ? ` · ${s.timeMs}ms` : " · —"}
        </p>
      </div>
      <span className="text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0">{formatRelativeTime(s.createdAt)}</span>
    </Link>
  );
}

function GroupRow({ group, colorIndex }: { group: ClassGroup; colorIndex: number }) {
  const color = GROUP_BADGE_COLORS[colorIndex % GROUP_BADGE_COLORS.length];

  return (
    <Link to={`/groups/${group.id}`} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card/60 transition-colors group">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${color.bg} ${color.text}`}
      >
        {String(colorIndex + 1).padStart(3, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{group.name}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {group.archived
            ? "Read-only"
            : group.memberCount != null
            ? `${group.memberCount} members`
            : group.schedule ?? "Active"}
        </p>
      </div>
      <ChevronRight size={15} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
    </Link>
  );
}
