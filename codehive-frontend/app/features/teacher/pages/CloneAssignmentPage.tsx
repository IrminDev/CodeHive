import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import {
  Home, BookOpen, Plus, GraduationCap, Users, Settings,
  Bell, Sun, Moon, ChevronRight, ArrowLeft, AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { sileo } from "sileo";
import { useTheme } from "~/core/providers/ThemeProvider";
import { useAuth } from "~/core/providers/AuthProvider";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ASSIGNMENTS: Record<string, {
  name: string; groupLabel: string; status: string;
  tests: number; memory: string; time: string; sourceGroupId: string;
}> = {
  "a2": {
    name: "Topological Sort — Course Scheduler",
    groupLabel: "CS-310 · Graph Theory",
    status: "READY", tests: 8, memory: "512MB", time: "3000ms",
    sourceGroupId: "2",
  },
  "a1": {
    name: "Two-Sum & K-Sum variants",
    groupLabel: "CS-201 · Algorithms",
    status: "READY", tests: 6, memory: "256MB", time: "2000ms",
    sourceGroupId: "1",
  },
};

interface CloneGroup {
  id: string;
  number: string;
  label: string;
  days?: string;
  accentHex: string;
  available: boolean;
  reason?: string;
}

const CLONE_GROUPS: Record<string, CloneGroup[]> = {
  "2": [
    { id: "1", number: "201", label: "CS-201 Algorithms",        days: "M-W-F", accentHex: "#00509D", available: true  },
    { id: "3", number: "410", label: "CS-410 Systems Programming",              accentHex: "#FDC500", available: true  },
    { id: "2", number: "310", label: "CS-310 Graph Theory",       days: "T-Th", accentHex: "#003F88", available: false, reason: "source group" },
    { id: "4", number: "150", label: "CS-150 Intro to Python",                  accentHex: "#4B5563", available: false, reason: "archived"      },
  ],
  "1": [
    { id: "2", number: "310", label: "CS-310 Graph Theory",       days: "T-Th", accentHex: "#003F88", available: true  },
    { id: "3", number: "410", label: "CS-410 Systems Programming",              accentHex: "#FDC500", available: true  },
    { id: "1", number: "201", label: "CS-201 Algorithms",         days: "M-W-F", accentHex: "#00509D", available: false, reason: "source group" },
    { id: "4", number: "150", label: "CS-150 Intro to Python",                  accentHex: "#4B5563", available: false, reason: "archived"      },
  ],
};

// ─── Layout primitives ────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CloneAssignmentPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "MH";

  const assignment = MOCK_ASSIGNMENTS[assignmentId ?? ""] ?? MOCK_ASSIGNMENTS["a2"];
  const groups     = CLONE_GROUPS[assignment.sourceGroupId] ?? CLONE_GROUPS["2"];
  const firstAvail = groups.find((g) => g.available)?.id ?? null;

  const [selectedGroup, setSelectedGroup] = useState<string | null>(firstAvail);
  const [launchDate, setLaunchDate] = useState("2026-06-05");
  const [dueDate, setDueDate]       = useState("2026-06-12");
  const [closeDate, setCloseDate]   = useState("2026-06-14");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClone(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup) {
      sileo.error({ title: "Select a destination group." });
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    sileo.success({ title: "Assignment cloned! Outputs are being regenerated." });
    navigate("/teacher/assignments");
    setIsSubmitting(false);
  }

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
          <SidebarIcon icon={BookOpen}      to="/teacher/assignments"       active label="Assignments" />
          <SidebarIcon icon={Plus}          to="/teacher/create-assignment" label="Create" />
          <SidebarIcon icon={GraduationCap} to="/teacher/grades"           label="Grades" />
          <SidebarIcon icon={Users}         to="/teacher/groups"           label="Groups" />
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
            <Link to="/teacher/assignments" className="hover:text-white transition-colors">Assignments</Link>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">Clone</span>
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
        <form onSubmit={handleClone}
          className="flex-1 overflow-y-auto scrollbar-hide px-8 py-7">
          <div className="max-w-2xl mx-auto w-full">

          {/* Page header */}
          <div className="flex items-start gap-4 mb-8">
            <button type="button" onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-700/50
                         text-gray-400 hover:text-white hover:border-gray-600 transition-all flex-shrink-0 mt-1">
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-yellow/20 bg-yellow/5 mb-2">
                <span className="text-[10px] tracking-widest uppercase font-semibold text-yellow/60">
                  Reuse Assignment
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">Clone to another group</h1>
            </div>
          </div>

          <div className="space-y-4">
            {/* ── Source assignment ── */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30 p-5">
              <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-4">
                Source Assignment
              </p>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 flex-shrink-0"><HexIcon size={20} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-0.5">{assignment.name}</p>
                  <p className="text-xs text-gray-500">
                    {assignment.groupLabel} · {assignment.status} · {assignment.tests} tests · {assignment.memory} / {assignment.time}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">
                  {assignment.status}
                </span>
              </div>
            </div>

            {/* ── Choose destination group ── */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30 p-5">
              <p className="text-sm font-semibold text-white mb-1">Choose destination group</p>
              <p className="text-xs text-gray-500 mb-5">
                Must be active, not archived, and different from the source group.
              </p>

              <div className="divide-y divide-gray-700/30">
                {groups.map((g) => (
                  <label
                    key={g.id}
                    className={`flex items-center gap-4 py-4 first:pt-0 last:pb-0 transition-colors ${
                      g.available ? "cursor-pointer hover:bg-white/[0.01]" : "cursor-not-allowed opacity-40"
                    }`}
                  >
                    {/* Radio */}
                    <div className="relative flex-shrink-0">
                      <input
                        type="radio"
                        name="destGroup"
                        value={g.id}
                        disabled={!g.available}
                        checked={selectedGroup === g.id}
                        onChange={() => g.available && setSelectedGroup(g.id)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedGroup === g.id && g.available
                          ? "border-yellow bg-yellow/10"
                          : "border-gray-600"
                      }`}>
                        {selectedGroup === g.id && g.available && (
                          <div className="w-2 h-2 rounded-full bg-yellow" />
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: g.accentHex }}
                    >
                      {g.number}
                    </div>

                    {/* Label */}
                    <span className={`flex-1 text-sm font-medium ${g.available ? "text-white" : "text-gray-500"}`}>
                      {g.label}{g.days ? ` · ${g.days}` : ""}
                    </span>

                    {/* Unavailable */}
                    {!g.available && (
                      <span className="text-xs font-mono text-gray-600 flex-shrink-0">unavailable</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* ── New dates ── */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30 p-5">
              <p className="text-sm font-semibold text-white mb-0.5">
                New dates{" "}
                <span className="text-xs text-gray-500 font-normal">(optional — otherwise copied as-is)</span>
              </p>
              <div className="grid grid-cols-3 gap-4 mt-5">
                {[
                  { label: "LAUNCH", value: launchDate, onChange: setLaunchDate },
                  { label: "DUE",    value: dueDate,    onChange: setDueDate    },
                  { label: "CLOSE",  value: closeDate,  onChange: setCloseDate  },
                ].map(({ label, value, onChange }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
                      {label}
                    </p>
                    <input
                      type="date"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm
                                 focus:outline-none focus:ring-2 focus:ring-azure focus:border-transparent
                                 transition-all appearance-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Info note ── */}
            <div className="flex gap-3 px-5 py-4 rounded-xl bg-dark-card border border-gray-700/30">
              <AlertTriangle size={15} className="text-yellow flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400 leading-relaxed">
                Copies metadata, languages, examples, reference solution and test inputs. Expected outputs are{" "}
                <span className="font-semibold text-white">regenerated asynchronously</span>{" "}
                — the clone starts in PROCESSING.
              </p>
            </div>

            {/* ── Submit ── */}
            <div className="flex justify-end gap-3 pb-8">
              <button type="button" onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl border border-gray-700/50 text-gray-300
                           hover:border-gray-600 hover:text-white transition-all text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || !selectedGroup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-azure text-white text-sm
                           font-medium hover:bg-french transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Cloning…
                  </>
                ) : (
                  "Clone assignment"
                )}
              </button>
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
