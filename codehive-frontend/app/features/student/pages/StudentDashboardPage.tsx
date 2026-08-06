import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Bell, BookOpen, ChevronRight, ClipboardList, Clock,
  GraduationCap, HardDrive, Home, Moon, Plus, RefreshCw,
  Search, Settings, Sun, Users,
} from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { getGroups } from "~/features/dashboard/api/dashboard.api";
import type { Group } from "~/features/dashboard/types/dashboard.types";
import { listAssignments } from "../api/assignment.api";
import type { Assignment, Language } from "../types/assignment.types";

const LANG_ABBR: Record<Language, string> = {
  PYTHON: "PY",
  JAVA: "JAVA",
  CPP: "C++",
  C: "C",
};

type FilterTab = "all" | "pending" | "inprogress" | "done";

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

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "mock-1", title: "Two-Sum & K-Sum variants", description: "",
    constraints: [], hints: [], tags: ["array", "hash-table"],
    timeLimitMs: 2000, memoryLimitMb: 256, comparatorType: "EXACT_MATCH",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    allowedLanguages: ["PYTHON", "JAVA", "CPP"], isActive: true,
  },
  {
    id: "mock-2", title: "Topological Sort — Course Scheduler", description: "",
    constraints: [], hints: [], tags: ["graph", "BFS"],
    timeLimitMs: 3000, memoryLimitMb: 512, comparatorType: "EXACT_MATCH",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    allowedLanguages: ["PYTHON", "JAVA"], isActive: true,
  },
  {
    id: "mock-3", title: "Memory-bound LRU Cache", description: "",
    constraints: [], hints: [], tags: ["design", "hash-table"],
    timeLimitMs: 1500, memoryLimitMb: 128, comparatorType: "EXACT_MATCH",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    allowedLanguages: ["C", "CPP"], isActive: true,
  },
  {
    id: "mock-4", title: "String tokenizer with backreferences", description: "",
    constraints: [], hints: [], tags: ["string", "parsing"],
    timeLimitMs: 2000, memoryLimitMb: 256, comparatorType: "EXACT_MATCH",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    allowedLanguages: ["PYTHON"], isActive: true,
  },
];

type SubmissionVerdict = "AC" | "WA" | "TLE" | "CE" | "RTE" | "MLE";

interface RecentSubmission {
  id: string;
  title: string;
  language: string;
  verdict: SubmissionVerdict;
  timeMs?: number;
  detail?: string;
  timeAgo: string;
}

const MOCK_SUBMISSIONS: RecentSubmission[] = [
  { id: "s1", title: "Two-sum (hash map)", language: "python", verdict: "AC", timeMs: 14, timeAgo: "2m" },
  { id: "s2", title: "Tree diameter — recursive", language: "java", verdict: "WA", timeMs: 180, timeAgo: "17m" },
  { id: "s3", title: "Quicksort partitioning", language: "c++", verdict: "TLE", detail: "TLE@8/10", timeAgo: "1h" },
  { id: "s4", title: "Bracket matching", language: "python", verdict: "CE", timeAgo: "3h" },
  { id: "s5", title: "Reverse linked list", language: "c", verdict: "AC", timeMs: 6, timeAgo: "yesterday" },
];

const VERDICT_STYLES: Record<SubmissionVerdict, { bg: string; text: string }> = {
  AC:  { bg: "bg-green-500/15",  text: "text-green-400" },
  WA:  { bg: "bg-red-500/15",   text: "text-red-400" },
  TLE: { bg: "bg-orange-500/15", text: "text-orange-400" },
  CE:  { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  RTE: { bg: "bg-red-500/15",   text: "text-red-400" },
  MLE: { bg: "bg-purple-500/15", text: "text-purple-400" },
};

const GROUP_BADGE_COLORS = [
  { bg: "bg-azure", text: "text-white" },
  { bg: "bg-french", text: "text-white" },
  { bg: "bg-yellow", text: "text-dark-bg" },
];

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [submissions] = useState<RecentSubmission[]>(
    import.meta.env.DEV ? MOCK_SUBMISSIONS : []
  );

  useEffect(() => {
    getGroups()
      .then(setGroups)
      .finally(() => setLoadingGroups(false));
    listAssignments(0, 12)
      .then((page) => {
        if (import.meta.env.DEV && page.content.length === 0) {
          setAssignments(MOCK_ASSIGNMENTS);
        } else {
          setAssignments(page.content);
        }
      })
      .catch(() => {
        if (import.meta.env.DEV) setAssignments(MOCK_ASSIGNMENTS);
      })
      .finally(() => setLoadingAssignments(false));
  }, []);

  const totalPending = groups.reduce((acc, g) => acc + g.pendingPractices, 0);
  const firstName = user?.name?.split(" ")[0] ?? "Student";

  const filteredAssignments = useMemo(() => {
    const now = new Date();
    if (filterTab === "pending")
      return assignments.filter((a) => a.isActive && (!a.dueDate || new Date(a.dueDate) > now));
    if (filterTab === "done")
      return assignments.filter((a) => !a.isActive || (!!a.dueDate && new Date(a.dueDate) < now));
    return assignments;
  }, [assignments, filterTab]);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">

      {/* ── Icon Sidebar ── */}
      <aside className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 bg-gray-50 dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800/60">
        {/* Logo */}
        <Link to="/" className="mb-4 flex-shrink-0">
          <div
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            className="w-9 h-9 bg-yellow flex items-center justify-center"
          >
            <span className="text-dark-bg font-bold text-sm leading-none">&lt;/&gt;</span>
          </div>
        </Link>

        <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
          <SidebarIcon icon={<Home size={20} />} label="Dashboard" to="/dashboard" active />
          <SidebarIcon icon={<Users size={20} />} label="Groups" to="/groups" />
          <SidebarIcon icon={<BookOpen size={20} />} label="Courses" to="/courses" />
          <SidebarIcon icon={<GraduationCap size={20} />} label="Grades" to="/grades" />
          <SidebarIcon icon={<ClipboardList size={20} />} label="Assignments" to="/assignments" />
        </nav>

        <div className="flex flex-col items-center gap-2 w-full px-2">
          <SidebarIcon icon={<Settings size={20} />} label="Settings" to="/settings" />
          <div
            title={user?.name}
            className="w-9 h-9 rounded-full bg-azure dark:bg-azure flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          >
            {firstName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <header className="h-12 flex-shrink-0 flex items-center gap-4 px-5 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800/60">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
            <span className="text-gray-400 dark:text-gray-500">Student</span>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">Dashboard</span>
          </div>

          {/* Search */}
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

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <Bell size={18} />
            </button>
            <button
              onClick={toggleTheme}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

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
                  You have{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totalPending} pending {totalPending === 1 ? "practice" : "practices"}
                  </span>{" "}
                  across your groups.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all">
                  <RefreshCw size={13} />
                  Sync
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french transition-colors">
                  <Plus size={13} />
                  Join class
                </button>
              </div>
            </div>

            {/* Assignments panel */}
            <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Available assignments</span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-dark-card text-xs font-mono text-gray-500 dark:text-gray-400">
                    {assignments.length}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {(["all", "pending", "inprogress", "done"] as FilterTab[]).map((tab) => {
                    const labels: Record<FilterTab, string> = {
                      all: "All",
                      pending: "Pending",
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
              ) : filteredAssignments.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-600">
                  No assignments found.
                </div>
              ) : (
                filteredAssignments.slice(0, 8).map((a, i) => (
                  <AssignmentRow key={a.id} assignment={a} index={i} />
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">My groups</span>
                <button className="text-xs text-yellow hover:text-gold transition-colors font-medium">Manage</button>
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
              {submissions.length === 0 ? (
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

function SidebarIcon({
  icon, label, to, active = false,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
        active
          ? "text-yellow bg-yellow/10 dark:bg-yellow/10"
          : "text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card"
      }`}
    >
      {icon}
    </Link>
  );
}

function AssignmentRow({ assignment, index }: { assignment: Assignment; index: number }) {
  const isOverdue = !!assignment.dueDate && new Date(assignment.dueDate) < new Date();

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
          {assignment.isActive && !isOverdue && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-azure/10 text-azure border border-azure/20 flex-shrink-0 dark:bg-azure/10 dark:text-azure dark:border-azure/20">
              active
            </span>
          )}
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
          <span className={`text-xs font-medium ${isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
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
  const style = VERDICT_STYLES[s.verdict];
  return (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card/60 transition-colors cursor-pointer group">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${style.bg} ${style.text}`}>
        {s.verdict}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.title}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
          {s.language}{s.timeMs ? ` · ${s.timeMs}ms` : s.detail ? ` · ${s.detail}` : " · —"}
        </p>
      </div>
      <span className="text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0">{s.timeAgo}</span>
    </div>
  );
}

function GroupRow({ group, colorIndex }: { group: Group; colorIndex: number }) {
  const color = GROUP_BADGE_COLORS[colorIndex % GROUP_BADGE_COLORS.length];

  return (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card/60 transition-colors cursor-pointer group">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${color.bg} ${color.text}`}
      >
        {String(colorIndex + 1).padStart(3, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{group.name}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {group.pendingPractices > 0
            ? `${group.pendingPractices} pending`
            : "All caught up"}
        </p>
      </div>
      <ChevronRight size={15} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
    </div>
  );
}
