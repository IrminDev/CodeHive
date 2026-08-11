import { Link } from "react-router";
import {
  Home, BookOpen, Plus, GraduationCap, Users,
  Settings, Bell, Download, ChevronRight, Clock, Sun, Moon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "~/core/providers/ThemeProvider";
import { useAuth } from "~/core/providers/AuthProvider";

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_ASSIGNMENTS = [
  { id: "1", title: "Binary Search Implementation", lang: "PY",   subs: 42, maxSubs: 50, avg: "8.4", due: "Jun 1, 2026",  status: "ACTIVE" },
  { id: "2", title: "Sorting Algorithms",           lang: "JAVA", subs: 28, maxSubs: 50, avg: "7.1", due: "May 25, 2026", status: "ACTIVE" },
  { id: "3", title: "Dynamic Programming Basics",   lang: "PY",   subs: 17, maxSubs: 50, avg: "6.8", due: "May 30, 2026", status: "ACTIVE" },
  { id: "4", title: "Graph Traversal",              lang: "C++",  subs: 0,  maxSubs: 50, avg: null,  due: "Jun 15, 2026", status: "DRAFT" },
];

const MOCK_GROUPS = [
  { id: "1", name: "Algorithms",          schedule: "M-W-F", code: "CS-201", students: 32, tasks: 6,  badge: 201, color: "bg-azure" },
  { id: "2", name: "Graph Theory",        schedule: "T-Th",  code: "CS-310", students: 24, tasks: 4,  badge: 310, color: "bg-french" },
  { id: "3", name: "Systems Programming", schedule: "",       code: "CS-410", students: 18, tasks: 2,  badge: 410, color: "bg-yellow text-imperial" },
  { id: "4", name: "Intro to Python",     schedule: "",       code: "CS-150", students: 13, tasks: 8,  badge: 150, color: "bg-imperial" },
];

// ─── Sidebar icon ─────────────────────────────────────────────────────────────

function SidebarIcon({
  icon: Icon,
  to,
  active = false,
  label,
}: {
  icon: LucideIcon;
  to: string;
  active?: boolean;
  label: string;
}) {
  return (
    <Link
      to={to}
      title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
        active ? "text-yellow bg-yellow/10" : "text-gray-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon size={18} />
    </Link>
  );
}

// ─── Hex outline ──────────────────────────────────────────────────────────────

function HexOutline() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none" className="flex-shrink-0">
      <polygon
        points="18,2 34,10 34,26 18,34 2,26 2,10"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-gray-600"
      />
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, detail, icon,
}: {
  label: string; value: number; detail: string; icon: LucideIcon;
}) {
  const Icon = icon;
  return (
    <div className="bg-dark-card rounded-2xl border border-gray-700/30 px-5 py-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase leading-snug">
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg bg-yellow/10 flex items-center justify-center text-yellow flex-shrink-0">
          <Icon size={14} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500">{detail}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TeacherDashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] ?? "María";
  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "MH";

  return (
    <div className="h-screen flex overflow-hidden bg-dark-bg text-white">
      {/* ── Sidebar ── */}
      <aside className="w-14 bg-dark-surface flex flex-col items-center py-3 gap-1 flex-shrink-0">
        {/* Logo */}
        <Link to="/teacher" className="mb-3">
          <div
            className="w-8 h-8 bg-yellow flex items-center justify-center text-imperial font-bold text-[10px]"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            {"</>"}
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          <SidebarIcon icon={Home}          to="/teacher"                   active label="Dashboard" />
          <SidebarIcon icon={BookOpen}      to="/teacher/assignments"       label="Assignments" />
          <SidebarIcon icon={Plus}          to="/teacher/create-assignment" label="Create" />
          <SidebarIcon icon={GraduationCap} to="/teacher/grades"           label="Grades" />
          <SidebarIcon icon={Users}         to="/teacher/groups"           label="Groups" />
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <Settings size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center text-imperial text-xs font-bold">
            {initials}
          </div>
        </div>
      </aside>

      {/* ── Right side ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 bg-dark-surface flex items-center px-6 gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mr-auto">
            <span>Teacher</span>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">Overview</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card border border-gray-700/50 text-gray-400 w-72">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-xs">Search assignments, groups...</span>
            <kbd className="text-xs bg-dark-surface px-1.5 py-0.5 rounded text-gray-500">⌘K</kbd>
          </div>

          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Bell size={16} />
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto scrollbar-hide px-8 py-7">
          {/* ── Welcome row ── */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-dark-card border border-gray-700/50 text-xs text-gray-300 font-semibold tracking-widest mb-2 uppercase">
                Teacher Console
              </div>
              <h1 className="text-3xl font-bold text-white leading-tight">
                Welcome back, <span className="text-azure">{firstName}</span>.
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-white font-medium">5 submissions</span> await review across 4 active groups.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 pt-1">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-card border border-gray-700/50 text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
                <Download size={14} />
                Export grades
              </button>
              <Link
                to="/teacher/create-assignment"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-azure text-white text-sm font-medium hover:bg-french transition-colors"
              >
                <Plus size={14} />
                Create assignment
              </Link>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Assignments" value={12} detail="8 active · 4 draft"  icon={BookOpen} />
            <StatCard label="Active Groups"     value={4}  detail="CS-201 · 310 · 410" icon={Users} />
            <StatCard label="Total Students"    value={87} detail="+12 this term"        icon={GraduationCap} />
            <StatCard label="Pending Reviews"   value={5}  detail="oldest 6h ago"        icon={Clock} />
          </div>

          {/* ── CTA banner ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-imperial via-french to-azure p-6 mb-6">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <div
                  className="w-7 h-7 bg-yellow flex items-center justify-center text-imperial font-bold text-xs"
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                >
                  +
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-white/70 font-medium">New assignment</span>
                </div>
                <p className="text-base font-semibold text-white">Ready to create a challenge?</p>
                <p className="text-xs text-white/60 mt-0.5">
                  Upload a reference solution, add test cases, and let CodeHive generate expected outputs and grade automatically.
                </p>
              </div>
              <Link
                to="/teacher/create-assignment"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow text-imperial text-sm font-bold hover:bg-yellow/90 transition-colors flex-shrink-0"
              >
                <Plus size={14} />
                Create assignment
              </Link>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="flex gap-5">
            {/* Recent assignments */}
            <div className="flex-1 min-w-0 bg-dark-card rounded-2xl border border-gray-700/30 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Recent assignments</span>
                  <span className="px-2 py-0.5 rounded-full bg-dark-surface text-xs text-gray-400 font-mono">
                    {MOCK_ASSIGNMENTS.length}
                  </span>
                </div>
                <Link to="/teacher/assignments" className="text-xs text-azure hover:text-yellow transition-colors font-medium">
                  View all
                </Link>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[2fr_60px_140px_80px_100px_80px] gap-4 px-5 py-2.5 border-b border-gray-700/20">
                {["TITLE", "LANGUAGE", "SUBMISSIONS", "AVG SCORE", "DUE DATE", "STATUS"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    {h}
                  </span>
                ))}
              </div>

              {MOCK_ASSIGNMENTS.map((a, i) => (
                <div
                  key={a.id}
                  className={`grid grid-cols-[2fr_60px_140px_80px_100px_80px] items-center px-5 py-3.5 hover:bg-dark-surface/40 transition-colors ${
                    i < MOCK_ASSIGNMENTS.length - 1 ? "border-b border-gray-700/20" : ""
                  }`}
                >
                  {/* Title */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <HexOutline />
                    <span className="text-sm text-white font-medium leading-snug line-clamp-2">{a.title}</span>
                  </div>
                  {/* Language */}
                  <span className="text-xs font-mono font-bold text-yellow">{a.lang}</span>
                  {/* Submissions + bar */}
                  <div className="flex items-center gap-2 pr-4">
                    <span className="text-sm text-gray-300 w-5 text-right tabular-nums flex-shrink-0">{a.subs}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-700 min-w-0">
                      <div
                        className="h-1.5 rounded-full bg-yellow"
                        style={{ width: `${Math.min(100, (a.subs / a.maxSubs) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Avg score */}
                  <span className="text-sm text-gray-300 tabular-nums">{a.avg ? `${a.avg}/10` : "—"}</span>
                  {/* Due date */}
                  <span className="text-sm text-gray-400">{a.due}</span>
                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.status === "ACTIVE" ? "bg-green-400" : "bg-yellow"}`} />
                    <span className={`text-xs font-medium ${a.status === "ACTIVE" ? "text-green-400" : "text-yellow"}`}>
                      {a.status === "ACTIVE" ? "Active" : "Draft"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* My groups */}
            <div className="w-72 flex-shrink-0 bg-dark-card rounded-2xl border border-gray-700/30 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">My groups</span>
                  <span className="px-2 py-0.5 rounded-full bg-dark-surface text-xs text-gray-400 font-mono">
                    {MOCK_GROUPS.length}
                  </span>
                </div>
                <button className="flex items-center gap-1 text-xs text-azure hover:text-yellow transition-colors font-medium">
                  <Plus size={12} />
                  New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-gray-700/20">
                {MOCK_GROUPS.map((g) => (
                  <Link
                    key={g.id}
                    to={`/teacher/groups/${g.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-dark-surface/40 transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white ${g.color}`}>
                      {g.badge}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white leading-snug truncate">
                        {g.name}{g.schedule ? ` · ${g.schedule}` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 font-mono">{g.code}</span>
                        <span className="text-xs text-gray-500">A {g.students}</span>
                        <span className="text-xs text-gray-500">{g.tasks} tasks</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-gray-700/30">
                <button className="flex items-center gap-2 text-xs text-azure hover:text-yellow transition-colors font-medium">
                  <Plus size={12} />
                  Create new group
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
