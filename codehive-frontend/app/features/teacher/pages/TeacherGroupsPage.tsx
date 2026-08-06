import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Home, BookOpen, Plus, GraduationCap, Users, Settings,
  Bell, Sun, Moon, ChevronRight, ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "~/core/providers/ThemeProvider";
import { useAuth } from "~/core/providers/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupStatus = "active" | "archived" | "deleted";
type AccentKey   = "azure" | "french" | "yellow" | "green" | "gray";
type Tab         = GroupStatus;

interface MockGroup {
  id: string;
  number: string;
  name: string;
  code: string;
  days?: string;
  term?: string;
  students: number;
  tasks: number;
  status: GroupStatus;
  accent: AccentKey;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACCENT_HEX: Record<AccentKey, string> = {
  azure:  "#00509D",
  french: "#003F88",
  yellow: "#FDC500",
  green:  "#10B981",
  gray:   "#4B5563",
};

const MOCK_GROUPS: MockGroup[] = [
  { id: "1", number: "201", name: "Algorithms",          code: "CS-201", days: "M-W-F",  students: 32, tasks: 6,  status: "active",   accent: "azure"  },
  { id: "2", number: "310", name: "Graph Theory",        code: "CS-310", days: "T-Th",   students: 24, tasks: 4,  status: "active",   accent: "french" },
  { id: "3", number: "410", name: "Systems Programming", code: "CS-410",                 students: 18, tasks: 2,  status: "active",   accent: "yellow" },
  { id: "4", number: "150", name: "Intro to Python",     code: "CS-150",                 students: 13, tasks: 8,  status: "archived", accent: "azure"  },
  { id: "5", number: "099", name: "Legacy",              code: "CS-099", term: "Fall 2024", students: 21, tasks: 11, status: "deleted", accent: "gray" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarIcon({ icon: Icon, to, active = false, label }: {
  icon: LucideIcon; to: string; active?: boolean; label: string;
}) {
  return (
    <Link to={to} title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
        active
          ? "text-yellow bg-yellow/10"
          : "text-gray-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon size={18} />
    </Link>
  );
}

function StatusBadge({ status }: { status: GroupStatus }) {
  if (status === "active") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Active
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow border border-yellow/30 bg-yellow/5">
        Archived
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-red-400 border border-red-400/30 bg-red-400/5">
      Deleted
    </span>
  );
}

function GroupCard({ group }: { group: MockGroup }) {
  const navigate = useNavigate();
  const hex = ACCENT_HEX[group.accent];
  const isDeleted = group.status === "deleted";

  const subtitle = [
    group.code,
    group.days ?? group.term,
  ].filter(Boolean).join(" · ");

  return (
    <div
      onClick={() => navigate(`/teacher/groups/${group.id}`)}
      className={`bg-dark-card rounded-2xl border p-5 cursor-pointer transition-all hover:border-gray-600/60 group ${
        isDeleted ? "border-gray-700/20 opacity-60" : "border-gray-700/30"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: hex }}
        >
          {group.number}
        </div>
        <StatusBadge status={group.status} />
      </div>

      <h3 className="text-base font-semibold text-white mb-0.5 leading-snug">{group.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{subtitle || <span className="text-gray-700">—</span>}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <Users size={13} className="text-gray-500" />
            {group.students}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <ClipboardList size={13} className="text-gray-500" />
            {group.tasks} {group.tasks === 1 ? "task" : "tasks"}
          </span>
        </div>
        <ChevronRight size={15} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TeacherGroupsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "MH";

  const [tab, setTab] = useState<Tab>("active");

  const counts: Record<Tab, number> = {
    active:   MOCK_GROUPS.filter((g) => g.status === "active").length,
    archived: MOCK_GROUPS.filter((g) => g.status === "archived").length,
    deleted:  MOCK_GROUPS.filter((g) => g.status === "deleted").length,
  };

  const filtered = MOCK_GROUPS.filter((g) => g.status === tab);

  const activeTerms = new Set(
    MOCK_GROUPS.filter((g) => g.status === "active" && g.term).map((g) => g.term)
  ).size + (MOCK_GROUPS.some((g) => g.status === "active" && !g.term) ? 1 : 0);

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
            <span className="text-white font-medium">Groups</span>
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

        {/* Main */}
        <main className="flex-1 overflow-y-auto scrollbar-hide px-8 py-7">
          {/* Page header row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-yellow/20 bg-yellow/5 mb-2">
                <span className="text-[10px] tracking-widest uppercase font-semibold text-yellow/60">
                  Group Management
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">My groups</h1>
              <p className="text-sm text-gray-400">
                You own{" "}
                <span className="font-semibold text-white">{MOCK_GROUPS.length} groups</span>{" "}
                across{" "}
                <span className="font-semibold text-white">{activeTerms} active</span>{" "}
                {activeTerms === 1 ? "term" : "terms"}.
              </p>
            </div>

            <button
              onClick={() => navigate("/teacher/groups/create")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-azure text-white text-sm font-medium hover:bg-french transition-colors flex-shrink-0"
            >
              <Plus size={15} />
              Create group
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6">
            {(["active", "archived", "deleted"] as Tab[]).map((key) => {
              const labels: Record<Tab, string> = { active: "Active", archived: "Archived", deleted: "Deleted" };
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-yellow text-imperial"
                      : "text-gray-400 hover:text-white hover:bg-dark-card"
                  }`}
                >
                  {labels[key]}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? "bg-imperial/20 text-imperial" : "bg-dark-card text-gray-500"
                  }`}>
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">No {tab} groups yet.</p>
              {tab === "active" && (
                <button
                  onClick={() => navigate("/teacher/groups/create")}
                  className="mt-4 px-4 py-2 rounded-xl bg-azure text-white text-sm font-medium hover:bg-french transition-colors"
                >
                  Create your first group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
