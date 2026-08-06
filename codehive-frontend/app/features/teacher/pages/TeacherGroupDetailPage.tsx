import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import {
  Home, BookOpen, Plus, GraduationCap, Users, Settings,
  Bell, Sun, Moon, ChevronRight, ArrowLeft, RefreshCw, RotateCcw, Copy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "~/core/providers/ThemeProvider";
import { useAuth } from "~/core/providers/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type EnrollStatus    = "ACTIVE" | "LEFT" | "REMOVED";
type AssignStatus    = "READY" | "PROCESSING" | "FAILED" | "PENDING";
type GroupLifecycle  = "active" | "archived" | "deleted";

interface RosterStudent {
  id: string;
  initials: string;
  color: string;
  name: string;
  enrollment: string;
  status: EnrollStatus;
  joined: string;
}

interface GroupAssignment {
  id: string;
  name: string;
  status: AssignStatus;
  submissions: number;
}

interface GroupDetail {
  id: string;
  number: string;
  name: string;
  section?: string;
  code: string;
  term: string;
  days: string;
  lifecycle: GroupLifecycle;
  joinCode: string;
  created: string;
  students: RosterStudent[];
  assignments: GroupAssignment[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_GROUPS: Record<string, GroupDetail> = {
  "1": {
    id: "1", number: "201", name: "Algorithms", section: "Section A",
    code: "CS-201", term: "Spring 2026", days: "M-W-F",
    lifecycle: "active", joinCode: "HIVE7K2X", created: "Jan 15, 2026",
    students: [
      { id: "s1", initials: "JG", color: "#10B981", name: "Juan García",     enrollment: "2021630001", status: "ACTIVE",  joined: "Jan 20, 2026" },
      { id: "s2", initials: "SV", color: "#6366F1", name: "Sofía Velázquez", enrollment: "2021630014", status: "ACTIVE",  joined: "Jan 22, 2026" },
      { id: "s3", initials: "CL", color: "#6B7280", name: "Carla López",     enrollment: "2021630021", status: "LEFT",    joined: "Jan 20, 2026" },
      { id: "s4", initials: "DR", color: "#3B82F6", name: "Diego Ramírez",   enrollment: "2021630007", status: "REMOVED", joined: "Feb 3, 2026"  },
    ],
    assignments: [
      { id: "a1", name: "Two-Sum & K-Sum variants",       status: "READY",      submissions: 42 },
      { id: "a2", name: "Topological Sort — Scheduler",   status: "READY",      submissions: 28 },
      { id: "a3", name: "Segment Tree Range Query",       status: "PROCESSING", submissions: 0  },
      { id: "a4", name: "Custom Comparator Sort",         status: "FAILED",     submissions: 0  },
    ],
  },
  "2": {
    id: "2", number: "310", name: "Graph Theory", section: undefined,
    code: "CS-310", term: "Spring 2026", days: "T-Th",
    lifecycle: "active", joinCode: "GRAP3X9Y", created: "Jan 15, 2026",
    students: [],
    assignments: [],
  },
};

// ─── Shared layout primitives ─────────────────────────────────────────────────

function SidebarIcon({ icon: Icon, to, active = false, label }: {
  icon: LucideIcon; to: string; active?: boolean; label: string;
}) {
  return (
    <Link to={to} title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
        active ? "text-yellow bg-yellow/10" : "text-gray-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon size={18} />
    </Link>
  );
}

function HexIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />
    </svg>
  );
}

// ─── Status badges ────────────────────────────────────────────────────────────

function EnrollBadge({ status }: { status: EnrollStatus }) {
  const cls: Record<EnrollStatus, string> = {
    ACTIVE:  "bg-green-500/10 text-green-400 border border-green-500/20",
    LEFT:    "bg-gray-700/30  text-gray-400  border border-gray-600/30",
    REMOVED: "bg-red-500/10   text-red-400   border border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls[status]}`}>
      {status}
    </span>
  );
}

function AssignBadge({ status }: { status: AssignStatus }) {
  const cls: Record<AssignStatus, string> = {
    READY:      "bg-green-500/10  text-green-400  border border-green-500/20",
    PROCESSING: "bg-yellow/10     text-yellow     border border-yellow/20",
    FAILED:     "bg-red-500/10    text-red-400    border border-red-500/20",
    PENDING:    "bg-gray-700/30   text-gray-400   border border-gray-600/30",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${cls[status]}`}>
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TeacherGroupDetailPage() {
  const navigate  = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "MH";

  const group = MOCK_GROUPS[groupId ?? ""];

  // local roster state to allow remove
  const [roster, setRoster] = useState<RosterStudent[]>(group?.students ?? []);
  const [joinCode, setJoinCode] = useState(group?.joinCode ?? "");

  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-bg text-gray-400">
        Group not found.
      </div>
    );
  }

  const activeStudents = roster.filter((s) => s.status === "ACTIVE").length;

  function removeStudent(id: string) {
    setRoster((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: "REMOVED" as EnrollStatus } : s)
    );
  }

  function rotateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setJoinCode(code);
  }

  const displayName = group.section ? `${group.name} · ${group.section}` : group.name;

  return (
    <div className="h-screen flex overflow-hidden bg-dark-bg text-white">
      {/* ── Sidebar ── */}
      <aside className="w-14 bg-dark-surface flex flex-col items-center py-3 gap-1 flex-shrink-0">
        <Link to="/teacher" className="mb-3">
          <div
            className="w-8 h-8 bg-yellow flex items-center justify-center text-imperial font-bold text-[10px]"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            {"</>"}
          </div>
        </Link>
        <nav className="flex flex-col items-center gap-1 flex-1">
          <SidebarIcon icon={Home}          to="/teacher"                   label="Dashboard" />
          <SidebarIcon icon={BookOpen}      to="/teacher/assignments"       label="Assignments" />
          <SidebarIcon icon={Plus}          to="/teacher/create-assignment" label="Create" />
          <SidebarIcon icon={GraduationCap} to="/teacher/grades"           label="Grades" />
          <SidebarIcon icon={Users}         to="/teacher/groups"           active label="Groups" />
        </nav>
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
            <Link to="/teacher/groups" className="hover:text-white transition-colors">Groups</Link>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">{group.code}</span>
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
          <button onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* ── Main column ── */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-7 min-w-0">
            {/* Page header */}
            <div className="flex items-start justify-between mb-7 gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate("/teacher/groups")}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-700/50
                             text-gray-400 hover:text-white hover:border-gray-600 transition-all flex-shrink-0">
                  <ArrowLeft size={16} />
                </button>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: "#00509D" }}
                >
                  {group.number}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-bold text-white">{displayName}</h1>
                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {[group.code, group.term, group.days].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={rotateCode}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700/50 text-gray-300
                             hover:border-gray-600 hover:text-white transition-all text-sm font-medium">
                  <RefreshCw size={13} />
                  Rotate code
                </button>
                <button
                  className="px-4 py-2 rounded-xl border border-gray-700/50 text-gray-300
                             hover:border-gray-600 hover:text-white transition-all text-sm font-medium">
                  Archive
                </button>
                <button
                  className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400
                             hover:border-red-400/50 hover:bg-red-500/5 transition-all text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>

            {/* ── Student roster ── */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30 mb-5">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">Student roster</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-surface border border-gray-700/50 text-gray-300">
                    {activeStudents} active
                  </span>
                </div>
                <span className="text-xs text-gray-600 font-mono">enrollment history preserved</span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[minmax(0,1fr)_140px_100px_130px_70px] gap-x-4 px-6 py-2.5 border-b border-gray-700/20">
                {["STUDENT", "ENROLLMENT", "STATUS", "JOINED", ""].map((h, i) => (
                  <span key={i} className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase">
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {roster.map((s) => (
                <div key={s.id}
                  className="grid grid-cols-[minmax(0,1fr)_140px_100px_130px_70px] gap-x-4 items-center px-6 py-3.5 border-b border-gray-700/20 last:border-0">
                  {/* Student */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: s.color }}>
                      {s.initials}
                    </div>
                    <span className="text-sm text-white font-medium truncate">{s.name}</span>
                  </div>
                  {/* Enrollment */}
                  <span className="text-sm font-mono text-gray-400">{s.enrollment}</span>
                  {/* Status */}
                  <EnrollBadge status={s.status} />
                  {/* Joined */}
                  <span className="text-sm text-gray-400">{s.joined}</span>
                  {/* Action */}
                  <div className="flex justify-end">
                    {s.status === "ACTIVE" && (
                      <button onClick={() => removeStudent(s.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                        remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Assignments in this group ── */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30">
                <span className="text-sm font-semibold text-white">Assignments in this group</span>
                <button
                  onClick={() => navigate("/teacher/create-assignment")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-azure text-white text-xs font-medium hover:bg-french transition-colors">
                  <Plus size={12} />
                  New
                </button>
              </div>

              {group.assignments.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-600">
                  No assignments linked to this group yet.
                </div>
              ) : (
                group.assignments.map((a, idx) => (
                  <div key={a.id}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer
                                ${idx < group.assignments.length - 1 ? "border-b border-gray-700/20" : ""}`}>
                    <span className="text-gray-600 flex-shrink-0"><HexIcon size={15} /></span>
                    <span className="flex-1 text-sm text-white font-medium min-w-0 truncate">{a.name}</span>
                    <AssignBadge status={a.status} />
                    <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">
                      {a.submissions} {a.submissions === 1 ? "sub" : "subs"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="w-80 flex-shrink-0 border-l border-gray-700/30 overflow-y-auto scrollbar-hide py-7 px-5 space-y-4">
            {/* Join code */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30 p-5">
              <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-4">
                Join Code
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-2xl tracking-[0.25em] font-bold text-yellow">
                  {joinCode}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => navigator.clipboard.writeText(joinCode)}
                    title="Copy code"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    <Copy size={13} />
                  </button>
                  <button onClick={rotateCode}
                    title="Rotate code"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Visible only to you as owner. Rotating invalidates the old code immediately.
              </p>
            </div>

            {/* Lifecycle */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30 p-5">
              <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-4">
                Lifecycle
              </p>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className="text-sm font-medium text-green-400">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Archived</span>
                  <span className="text-sm text-gray-300">No</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Created</span>
                  <span className="text-sm text-gray-300">{group.created}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-700/30">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Archiving makes the group read-only — no joins, edits, or new submissions. Deleting hides it from students but preserves history for cloning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
