import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Home, BookOpen, Plus, GraduationCap, Users, Settings, Bell,
  Sun, Moon, ChevronRight, ArrowLeft, X, Check, Info, Mail, Link2, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { sileo } from "sileo";
import { useTheme } from "~/core/providers/ThemeProvider";
import { useAuth } from "~/core/providers/AuthProvider";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { id: "azure",  hex: "#00509D", ring: "ring-azure" },
  { id: "french", hex: "#1D4ED8", ring: "ring-blue-600" },
  { id: "yellow", hex: "#FDC500", ring: "ring-yellow" },
  { id: "green",  hex: "#10B981", ring: "ring-emerald-500" },
  { id: "rose",   hex: "#F43F5E", ring: "ring-rose-500" },
];

const TERMS = [
  "Spring 2026", "Summer 2026", "Fall 2026", "Winter 2026", "Spring 2027",
];

const DAYS = ["M", "T", "W", "Th", "F"];

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

function SectionCard({ number, title, badge, children }: {
  number: string; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-dark-card rounded-2xl border border-gray-700/30 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-700/30">
        <span className="text-sm font-mono font-semibold text-gray-600">{number}</span>
        <span className="text-sm font-semibold text-white">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-xs text-gray-400 bg-dark-surface border border-gray-700/50">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">
      {children}
    </label>
  );
}

function StyledInput({ id, value, onChange, placeholder, type = "text" }: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <input
      id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white
                 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-azure
                 focus:border-transparent transition-all text-sm"
    />
  );
}

function CheckItem({ done, label, pending = false }: {
  done: boolean; label: string; pending?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? "bg-green-500/20" : pending ? "bg-yellow/10" : "bg-gray-700/50"
      }`}>
        {done ? <Check size={9} className="text-green-400" /> :
         pending ? <span className="w-1.5 h-1.5 rounded-full bg-yellow" /> :
         <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />}
      </div>
      <span className={`text-xs ${done ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CreateGroupPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "MH";

  // ── Form state ──
  const [courseCode, setCourseCode]   = useState("");
  const [groupName, setGroupName]     = useState("");
  const [description, setDescription] = useState("");
  const [accentColor, setAccentColor] = useState("azure");

  const [term, setTerm]             = useState("");
  const [meetingDays, setMeetingDays] = useState<string[]>([]);
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");

  const [studentTab, setStudentTab]   = useState<"email" | "code" | "csv">("email");
  const [emailInput, setEmailInput]   = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const csvRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile]         = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Helpers ──
  function toggleDay(day: string) {
    setMeetingDays((p) => p.includes(day) ? p.filter((d) => d !== day) : [...p, day]);
  }

  function addEmail() {
    const e = emailInput.trim().toLowerCase();
    if (e && !inviteEmails.includes(e)) setInviteEmails((p) => [...p, e]);
    setEmailInput("");
  }

  // ── Preview data ──
  const accentHex  = ACCENT_COLORS.find((c) => c.id === accentColor)?.hex ?? "#00509D";
  const courseNum  = courseCode.replace(/[^0-9]/g, "").slice(-3) || courseCode.slice(0, 3);
  const daysLabel  = DAYS.filter((d) => meetingDays.includes(d)).join("") || "—";

  // ── Checklist ──
  const hasIdentity  = courseCode.trim().length > 0 && groupName.trim().length > 0;
  const hasSchedule  = meetingDays.length > 0 || startDate.length > 0;
  const hasStudents  = inviteEmails.length > 0 || csvFile !== null;

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasIdentity) {
      sileo.error({ title: "Course code and group name are required." });
      return;
    }
    setIsSubmitting(true);
    try {
      if (import.meta.env.DEV) {
        await new Promise((r) => setTimeout(r, 800));
        sileo.success({ title: "Group created! Students can now join with the code." });
        navigate("/teacher");
        return;
      }
      // TODO: call real API when available
    } catch (err) {
      sileo.error({ title: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
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
            <span>Groups</span>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">New group</span>
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
        <div className="flex-1 flex min-h-0">
          {/* ── Form ── */}
          <form onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto scrollbar-hide px-8 py-7 min-w-0">
            {/* Page header */}
            <div className="flex items-center gap-4 mb-8">
              <button type="button" onClick={() => navigate("/teacher/groups")}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-700/50
                           text-gray-400 hover:text-white hover:border-gray-600 transition-all flex-shrink-0">
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-dark-card border border-gray-700/50 text-xs text-gray-300 font-semibold tracking-widest mb-1 uppercase">
                  New Group
                </div>
                <h1 className="text-2xl font-bold text-white">Create a group</h1>
              </div>
            </div>

            <div className="space-y-5">
              {/* ── 01 Group identity ── */}
              <SectionCard number="01" title="Group identity" badge="Required">
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="courseCode">Course code</FieldLabel>
                      <StyledInput
                        id="courseCode" value={courseCode} onChange={setCourseCode}
                        placeholder="e.g. CS-220"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="groupName">Group name</FieldLabel>
                      <StyledInput
                        id="groupName" value={groupName} onChange={setGroupName}
                        placeholder="e.g. Data Structures · Section A"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="description">
                      Description <span className="text-gray-600 font-normal">(optional)</span>
                    </FieldLabel>
                    <textarea
                      id="description" value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Spring 2026 cohort. Weekly practices on trees, heaps and hashing."
                      className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm
                                 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-azure
                                 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Accent color</FieldLabel>
                    <div className="flex items-center gap-3">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAccentColor(c.id)}
                          className={`w-10 h-10 rounded-full transition-all flex items-center justify-center
                                      ${accentColor === c.id ? `ring-2 ring-offset-2 ring-offset-dark-card ${c.ring}` : "hover:scale-110"}`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {accentColor === c.id && <Check size={14} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ── 02 Schedule & term ── */}
              <SectionCard number="02" title="Schedule & term" badge="Optional">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Term */}
                  <div>
                    <FieldLabel htmlFor="term">Term</FieldLabel>
                    <div className="relative">
                      <select
                        id="term" value={term} onChange={(e) => setTerm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm
                                   focus:outline-none focus:ring-2 focus:ring-azure focus:border-transparent
                                   transition-all appearance-none cursor-pointer"
                      >
                        <option value="">— Select term</option>
                        {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Meeting days */}
                  <div>
                    <FieldLabel>Meeting days</FieldLabel>
                    <div className="flex gap-2">
                      {DAYS.map((day) => {
                        const active = meetingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                              active
                                ? "bg-yellow/15 text-yellow border border-yellow/40"
                                : "bg-dark-surface text-gray-500 border border-gray-700/50 hover:border-gray-600 hover:text-gray-300"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Start date */}
                  <div>
                    <FieldLabel htmlFor="startDate">Start date</FieldLabel>
                    <StyledInput
                      id="startDate" type="date" value={startDate} onChange={setStartDate}
                    />
                  </div>

                  {/* End date */}
                  <div>
                    <FieldLabel htmlFor="endDate">End date</FieldLabel>
                    <StyledInput
                      id="endDate" type="date" value={endDate} onChange={setEndDate}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* ── 03 Add students ── */}
              <SectionCard number="03" title="Add students" badge="Optional">
                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                  {(["email", "code", "csv"] as const).map((tab) => {
                    const labels = { email: "Invite by email", code: "Share join code", csv: "Import CSV" };
                    const active = studentTab === tab;
                    return (
                      <button key={tab} type="button" onClick={() => setStudentTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          active
                            ? "bg-yellow text-imperial shadow-sm"
                            : "text-gray-400 hover:bg-dark-surface hover:text-white"
                        }`}>
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

                {/* Invite by email */}
                {studentTab === "email" && (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="email" value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }}
                        placeholder="student@university.edu"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700/50 bg-dark-surface text-white text-sm
                                   placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-azure
                                   focus:border-transparent transition-all"
                      />
                      <button type="button" onClick={addEmail}
                        className="px-4 py-2.5 rounded-xl bg-azure text-white text-sm font-medium hover:bg-french transition-colors">
                        Add
                      </button>
                    </div>
                    {inviteEmails.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {inviteEmails.map((email) => (
                          <span key={email}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-surface border border-gray-700/50 text-xs text-gray-300">
                            <Mail size={11} className="text-gray-500" />
                            {email}
                            <button type="button" onClick={() => setInviteEmails((p) => p.filter((e) => e !== email))}
                              className="hover:text-red-400 transition-colors">
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">Add student emails — they'll be enrolled when you create the group.</p>
                    )}
                  </div>
                )}

                {/* Share join code */}
                {studentTab === "code" && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-dark-surface border border-gray-700/30">
                    <Link2 size={16} className="text-azure flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-white font-medium mb-1">Join code generated on creation</p>
                      <p className="text-xs text-gray-500">
                        Once the group is created, an 8-character join code will be generated automatically.
                        Share it with your students and they can join from the CodeHive app.
                      </p>
                    </div>
                  </div>
                )}

                {/* Import CSV */}
                {studentTab === "csv" && (
                  <div>
                    <div
                      onClick={() => csvRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setCsvFile(f); }}
                      className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer
                                 hover:border-azure/50 transition-colors"
                    >
                      <input ref={csvRef} type="file" accept=".csv" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f); }} />
                      {csvFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText size={18} className="text-azure" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{csvFile.name}</p>
                            <p className="text-xs text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setCsvFile(null); }}
                            className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <FileText size={22} className="text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 mb-1">Drop your CSV or <span className="text-azure">browse</span></p>
                          <p className="text-xs text-gray-600">One enrollment number or email per row</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* ── Submit ── */}
              <div className="flex justify-end gap-3 pb-8">
                <button type="button" onClick={() => navigate("/teacher")}
                  className="px-5 py-2.5 rounded-xl border border-gray-700/50 text-gray-300
                             hover:border-gray-600 hover:text-white transition-all text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-azure text-white text-sm
                             font-medium hover:bg-french transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating…
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Create group
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* ── Live preview sidebar ── */}
          <div className="w-80 flex-shrink-0 border-l border-gray-700/30 overflow-y-auto scrollbar-hide py-7 px-5">
            <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">
              Live Preview
            </p>

            {/* Group card preview */}
            <div className="bg-dark-card rounded-2xl border border-gray-700/30 p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: accentHex }}
                >
                  {courseNum || "—"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug truncate">
                    {groupName || <span className="text-gray-600 font-normal">Group name…</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[courseCode, term].filter(Boolean).join(" · ") || <span className="text-gray-700">CS-000 · Term</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-700/30">
                {[
                  { label: "STUDENTS", value: inviteEmails.length || (csvFile ? "CSV" : "0") },
                  { label: "TASKS",    value: "0" },
                  { label: "DAYS",     value: daysLabel },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-base font-bold text-white">{value}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">
              Checklist
            </p>
            <div className="space-y-2.5 mb-4">
              <CheckItem done={hasIdentity}  label="Course code & name" />
              <CheckItem done={true}         label="Accent color" />
              <CheckItem done={hasSchedule}  label="Schedule set" pending={!hasSchedule} />
              <CheckItem done={hasStudents}  label="At least 1 student" pending={!hasStudents} />
            </div>

            <div className="flex gap-2.5 p-3 rounded-xl bg-dark-card border border-gray-700/30">
              <Info size={13} className="text-azure flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Once created, this group appears on your dashboard and becomes selectable when you publish an assignment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
