import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import type { TeacherDashboardData } from "../types/dashboard.types";
import { panelClass, StatusPill } from "./TeacherUI";

export function DashboardSummary({ summary }: { summary: TeacherDashboardData["summary"] }) {
  return (
    <section aria-label="Teacher overview" className="grid grid-cols-2 gap-3 lg:grid-cols-12">
      <SummaryCard to="/teacher/groups" icon={<Users size={16} />} label="Active groups" value={summary.activeGroups} className="lg:col-span-2" />
      <SummaryCard to="/teacher/groups" icon={<GraduationCap size={16} />} label="Students" value={summary.activeStudents} className="lg:col-span-2" />
      <SummaryCard to="/teacher/assignments" icon={<BookOpen size={16} />} label="Assignments" value={summary.activeAssignments} className="lg:col-span-2" />
      <SummaryCard to="/teacher/grades" icon={<Clock3 size={17} />} label="Needs grading" value={summary.needsGrading} emphasis="warning" className="lg:col-span-3" />
      <SummaryCard to="/teacher/assignments" icon={<AlertTriangle size={17} />} label="Validation issues" value={summary.validationIssues} emphasis="error" className="lg:col-span-3" />
    </section>
  );
}

function SummaryCard({ to, icon, label, value, emphasis = "neutral", className = "" }: { to: string; icon: ReactNode; label: string; value: number; emphasis?: "neutral" | "warning" | "error"; className?: string }) {
  const style = emphasis === "error"
    ? "border-red-500/25 bg-red-500/5 hover:border-red-500/45"
    : emphasis === "warning"
      ? "border-orange-500/25 bg-orange-500/5 hover:border-orange-500/45"
      : "hover:border-azure/30 dark:hover:border-yellow/30";
  const iconStyle = emphasis === "error"
    ? "bg-red-500/10 text-red-500"
    : emphasis === "warning"
      ? "bg-orange-500/10 text-orange-500"
      : "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow";
  const valueStyle = emphasis === "error" ? "text-red-500" : emphasis === "warning" ? "text-orange-500" : "text-gray-900 dark:text-white";

  return (
    <Link to={to} className={`${panelClass} ${style} ${className} group p-4 transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconStyle}`}>{icon}</span>
        <ArrowRight size={14} className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-gray-700 dark:group-hover:text-gray-400" />
      </div>
      <p className={`mt-3 text-2xl font-bold ${valueStyle}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      {emphasis !== "neutral" && <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">{value ? "Action required" : "Queue clear"}</p>}
    </Link>
  );
}

export function ValidationQueue({ items }: { items: TeacherDashboardData["validationItems"] }) {
  const ordered = [...items].sort((left, right) => Number(right.status === "FAILED") - Number(left.status === "FAILED"));
  return (
    <DashboardPanel title="Needs attention" description="Validation failures and assignments still processing." link="/teacher/assignments" linkLabel="All assignments" accent="error">
      {ordered.length === 0 ? <QueueClear text="No validation issues." /> : ordered.map((item) => {
        const failed = item.status === "FAILED";
        const url = `/teacher/assignments?groupId=${encodeURIComponent(item.groupId)}&validationStatus=${item.status}&statusId=${encodeURIComponent(item.assignmentId)}`;
        return (
          <Link key={item.assignmentId} to={url} className="group relative flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-dark-card/50">
            <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${failed ? "bg-red-500" : "bg-yellow"}`} />
            <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${failed ? "bg-red-500/10 text-red-500" : "bg-yellow/10 text-yellow-700 dark:text-yellow"}`}>
              {failed ? <AlertTriangle size={16} /> : <Clock3 size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{item.groupName}</p>
            </div>
            <StatusPill label={item.status} tone={failed ? "error" : "warning"} />
            <span className={`hidden text-xs font-semibold sm:inline ${failed ? "text-red-500" : "text-yellow-700 dark:text-yellow"}`}>{failed ? "Review error" : "View progress"}</span>
            <ArrowRight size={14} className="text-gray-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </DashboardPanel>
  );
}

export function GradingQueue({ items }: { items: TeacherDashboardData["gradingItems"] }) {
  const ordered = [...items].sort((left, right) => right.needsGrading - left.needsGrading);
  return (
    <DashboardPanel title="Grading queue" description="Submitted work waiting for teacher review." link="/teacher/grades" linkLabel="Open gradebook" accent="warning">
      {ordered.length === 0 ? <QueueClear text="Grading queue is clear." /> : ordered.map((item) => {
        const reviewed = Math.max(0, item.submitted - item.needsGrading);
        const progress = item.submitted ? Math.min(100, Math.round((reviewed / item.submitted) * 100)) : 0;
        return (
          <Link key={item.assignmentId} to={`/teacher/grades?groupId=${encodeURIComponent(item.groupId)}&assignmentId=${encodeURIComponent(item.assignmentId)}`} className="group block px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-dark-card/50">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-500"><GraduationCap size={16} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p><p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{item.groupName} · {item.submitted} submitted</p></div>
              <div className="text-right"><p className="font-mono text-lg font-bold text-orange-500">{item.needsGrading}</p><p className="text-[10px] uppercase tracking-wide text-gray-500">waiting</p></div>
              <ArrowRight size={14} className="text-gray-300 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="ml-12 mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-surface"><div className="h-full rounded-full bg-azure dark:bg-yellow" style={{ width: `${progress}%` }} /></div><span className="w-8 text-right font-mono text-[10px] text-gray-500">{progress}%</span></div>
          </Link>
        );
      })}
    </DashboardPanel>
  );
}

export function UpcomingTimeline({ items }: { items: TeacherDashboardData["upcomingDeadlines"] }) {
  const events = items.map(nearestEvent).filter((item): item is TimelineItem => item != null).sort((left, right) => left.timestamp - right.timestamp);
  return (
    <DashboardPanel title="Upcoming dates" description="Nearest assignment milestones.">
      {events.length === 0 ? <CompactEmpty icon={<CalendarClock size={21} />} text="No upcoming dates." /> : events.map((item) => (
        <Link key={`${item.assignmentId}-${item.kind}`} to={`/teacher/assignments/${item.assignmentId}/preview`} className="group flex gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-dark-card/50">
          <div className="flex flex-col items-center"><span className={`grid h-8 w-8 place-items-center rounded-lg ${item.kind === "Due" ? "bg-orange-500/10 text-orange-500" : item.kind === "Close" ? "bg-red-500/10 text-red-500" : "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"}`}><Clock3 size={14} /></span><span className="mt-1 h-full w-px bg-gray-100 group-last:hidden dark:bg-gray-800" /></div>
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{item.kind}</span><span className="font-mono text-[10px] text-gray-500">{relativeDate(item.timestamp)}</span></div><p className="mt-1 truncate text-sm font-medium text-gray-900 dark:text-white">{item.title}</p><p className="mt-1 text-[10px] font-mono text-gray-500">{formatDateTime(item.date)}</p></div>
        </Link>
      ))}
    </DashboardPanel>
  );
}

export function RecentSubmissionActivity({ items }: { items: TeacherDashboardData["recentSubmissions"] }) {
  return (
    <DashboardPanel title="Recent submissions" description="Latest definitive student attempts." link="/teacher/grades" linkLabel="Open gradebook">
      {items.length === 0 ? <CompactEmpty icon={<BookOpen size={21} />} text="No submissions yet." /> : items.slice(0, 6).map((item) => (
        <Link key={item.submissionId} to={`/teacher/grades?groupId=${encodeURIComponent(item.groupId)}&assignmentId=${encodeURIComponent(item.assignmentId)}&studentId=${encodeURIComponent(item.studentId)}`} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-card/50">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-azure/10 text-[10px] font-bold text-azure dark:bg-yellow/10 dark:text-yellow">{initials(item.studentName)}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-gray-900 dark:text-white">{item.studentName}</p><p className="mt-0.5 truncate text-[10px] text-gray-500">{item.assignmentTitle} · {item.language} · {formatDateTime(item.submittedAt)}</p></div>
          {item.verdict && <StatusPill label={item.verdict} tone={item.verdict === "AC" ? "success" : item.verdict === "PENDING" ? "warning" : "error"} />}
          <ArrowRight size={13} className="text-gray-300 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </DashboardPanel>
  );
}

function DashboardPanel({ title, description, link, linkLabel = "View all", accent, children }: { title: string; description: string; link?: string; linkLabel?: string; accent?: "error" | "warning"; children: ReactNode }) {
  return (
    <section className={`${panelClass} overflow-hidden ${accent === "error" ? "border-t-2 border-t-red-500" : accent === "warning" ? "border-t-2 border-t-orange-500" : ""}`}>
      <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800/60">
        <div><h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2><p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p></div>
        {link && <Link to={link} className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-azure hover:underline dark:text-yellow">{linkLabel}<ArrowRight size={12} /></Link>}
      </header>
      <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{children}</div>
    </section>
  );
}

function QueueClear({ text }: { text: string }) {
  return <div className="flex items-center gap-3 bg-green-500/5 px-5 py-7 text-green-600 dark:text-green-400"><span className="grid h-9 w-9 place-items-center rounded-xl bg-green-500/10"><CheckCircle2 size={19} /></span><div><p className="text-sm font-semibold">All clear</p><p className="mt-0.5 text-xs opacity-80">{text}</p></div></div>;
}

function CompactEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="px-5 py-8 text-center text-gray-400"><div className="mb-2 flex justify-center">{icon}</div><p className="text-xs">{text}</p></div>;
}

interface TimelineItem {
  assignmentId: string;
  title: string;
  kind: "Launch" | "Due" | "Close";
  date: string;
  timestamp: number;
}

function nearestEvent(item: TeacherDashboardData["upcomingDeadlines"][number]): TimelineItem | null {
  const now = Date.now();
  const candidates = [
    item.launchDate ? { kind: "Launch" as const, date: item.launchDate } : null,
    item.dueDate ? { kind: "Due" as const, date: item.dueDate } : null,
    item.closeDate ? { kind: "Close" as const, date: item.closeDate } : null,
  ].filter((candidate): candidate is { kind: TimelineItem["kind"]; date: string } => candidate != null)
    .map((candidate) => ({ ...candidate, timestamp: Date.parse(candidate.date) }))
    .filter((candidate) => Number.isFinite(candidate.timestamp) && candidate.timestamp >= now)
    .sort((left, right) => left.timestamp - right.timestamp);
  const event = candidates[0];
  return event ? { assignmentId: item.assignmentId, title: item.title, ...event } : null;
}

function relativeDate(timestamp: number): string {
  const hours = Math.max(0, Math.round((timestamp - Date.now()) / 3_600_000));
  if (hours < 24) return hours <= 1 ? "within 1h" : `in ${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days}d`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ST";
}
