import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft, CalendarDays, ChevronRight, CircleCheck, CircleAlert, Clock3,
  BarChart3, HardDrive, LogOut, RefreshCw, UserRound, Users,
} from "lucide-react";

import { listAssignments } from "../api/assignment.api";
import { getGroup, leaveGroup } from "../api/group.api";
import { listGroupSubmissions } from "../api/submission.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { Assignment, Language } from "../types/assignment.types";
import type { ClassGroup } from "../types/group.types";
import type { GroupSubmission } from "../types/group-submission.types";

const LANG_ABBR: Record<Language, string> = {
  PYTHON: "PY",
  JAVA: "JAVA",
  CPP: "C++",
  C: "C",
};

type DeliveryState = { label: string; detail: string; className: string; accepted: boolean };

function formatDate(value?: string): string {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function deliveryState(assignment: Assignment, submission?: GroupSubmission): DeliveryState {
  if (submission) {
    const submitted = `Submitted ${formatDate(submission.submittedAt)}`;
    const status = submission.executionStatus ?? "PENDING";
    if (status === "AC") {
      return {
        label: submission.deliveredLate ? "Delivered late · accepted" : "Delivered · accepted",
        detail: submitted,
        className: "bg-green-500/10 text-green-500 border-green-500/20",
        accepted: true,
      };
    }
    if (status === "PENDING") {
      return {
        label: "Delivered · checking",
        detail: submitted,
        className: "bg-yellow/10 text-yellow border-yellow/20",
        accepted: false,
      };
    }
    const verdicts: Record<string, string> = {
      WA: "Wrong answer",
      CE: "Compilation error",
      RTE: "Runtime error",
      TLE: "Time limit exceeded",
      MLE: "Memory limit exceeded",
      OLE: "Output limit exceeded",
    };
    return {
      label: `Delivered · ${verdicts[status] ?? status}`,
      detail: `${submitted}${submission.deliveredLate ? " · late" : ""}`,
      className: status === "TLE" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-red-500/10 text-red-500 border-red-500/20",
      accepted: false,
    };
  }

  const now = Date.now();
  if (assignment.closeDate && Date.parse(assignment.closeDate) <= now) {
    return { label: "Closed · no submission", detail: `Closed ${formatDate(assignment.closeDate)}`, className: "bg-red-500/10 text-red-500 border-red-500/20", accepted: false };
  }
  if (assignment.dueDate && Date.parse(assignment.dueDate) < now) {
    return { label: "Late · not delivered", detail: `Due ${formatDate(assignment.dueDate)}`, className: "bg-orange-500/10 text-orange-500 border-orange-500/20", accepted: false };
  }
  if (assignment.launchDate && Date.parse(assignment.launchDate) > now) {
    return { label: "Not open yet", detail: `Opens ${formatDate(assignment.launchDate)}`, className: "bg-gray-500/10 text-gray-500 border-gray-500/20", accepted: false };
  }
  return assignment.dueDate
    ? { label: "Not delivered", detail: `Due ${formatDate(assignment.dueDate)}`, className: "bg-yellow/10 text-yellow border-yellow/20", accepted: false }
    : { label: "Not delivered", detail: "No due date", className: "bg-yellow/10 text-yellow border-yellow/20", accepted: false };
}

export function StudentGroupDetailPage() {
  const navigate = useNavigate();
  const { groupId = "" } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<ClassGroup | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<GroupSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) {
      setError("Group not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [groupResult, assignmentPage, submissionResult] = await Promise.all([
        getGroup(groupId),
        listAssignments(groupId),
        listGroupSubmissions(groupId),
      ]);
      setGroup(groupResult);
      setAssignments(assignmentPage.content);
      setSubmissions(submissionResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this group.");
      setGroup(null);
      setAssignments([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  async function leaveCurrentGroup() {
    if (!group) return;
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveGroup(group.id);
      navigate("/groups");
    } catch (cause) {
      setLeaveError(cause instanceof Error ? cause.message : "Could not leave this group.");
    } finally {
      setLeaving(false);
    }
  }

  const submissionByAssignment = useMemo(
    () => new Map(submissions.map((submission) => [submission.assignmentId, submission])),
    [submissions],
  );
  const deliveredCount = submissions.length;
  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="groups" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Groups", to: "/groups" }, { label: group?.name ?? "Group" }]} />

        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          {loading ? (
            <div className="max-w-5xl mx-auto space-y-5 animate-pulse">
              <div className="h-36 rounded-2xl bg-gray-100 dark:bg-dark-surface" />
              <div className="h-56 rounded-2xl bg-gray-100 dark:bg-dark-surface" />
            </div>
          ) : error || !group ? (
            <div className="max-w-xl mx-auto mt-20 text-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
              <CircleAlert className="mx-auto text-red-500 mb-3" size={28} />
              <h1 className="font-semibold text-lg">Group unavailable</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error ?? "This group is no longer available."}</p>
              <Link to="/dashboard" className="inline-flex mt-5 btn-primary">Back to dashboard</Link>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              <Link to="/groups" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"><ArrowLeft size={14} /> All groups</Link>

              <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-6 lg:p-7">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 rounded-xl bg-yellow/10 text-yellow grid place-items-center"><Users size={21} /></div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${group.archived ? "bg-gray-500/10 text-gray-500 border-gray-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}`}>{group.archived ? "Read-only" : "Active"}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
                    <p className="max-w-2xl mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{group.description || "No group description provided."}</p>
                  </div>
                  <div className="flex self-start items-center gap-2">
                    <Link to={`/groups/${group.id}/metrics`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"><BarChart3 size={13} /> Progress</Link>
                    <button onClick={() => void load()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"><RefreshCw size={13} /> Refresh</button>
                    <button onClick={() => { setLeaveError(null); setShowLeaveConfirm(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"><LogOut size={13} /> Leave class</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <DetailCard icon={<UserRound size={15} />} label="Teacher" value={group.ownerName || "—"} />
                  <DetailCard icon={<CalendarDays size={15} />} label="Created" value={formatDate(group.createdAt)} />
                  <DetailCard icon={<CircleCheck size={15} />} label="Delivery progress" value={`${deliveredCount} / ${assignments.length} delivered`} />
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Assignments</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Your current delivery status for each assignment.</p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-dark-card text-xs font-mono text-gray-500 dark:text-gray-400">{assignments.length}</span>
                </div>
                {assignments.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-600">No assignments published for this group.</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {assignments.map((assignment, index) => {
                      const state = deliveryState(assignment, submissionByAssignment.get(assignment.id));
                      return <AssignmentItem key={assignment.id} assignment={assignment} index={index} state={state} />;
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {showLeaveConfirm && group && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-dark-bg/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="leave-group-title">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 grid place-items-center flex-shrink-0"><LogOut size={19} /></div>
              <div>
                <h2 id="leave-group-title" className="text-lg font-semibold text-gray-900 dark:text-white">Leave {group.name}?</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">You will lose access to this class and its assignments. Rejoining with the group code restores your enrollment history.</p>
              </div>
            </div>
            {leaveError && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-600 dark:text-red-400">{leaveError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button disabled={leaving} onClick={() => setShowLeaveConfirm(false)} className="btn-outline">Cancel</button>
              <button disabled={leaving} onClick={() => void leaveCurrentGroup()} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">{leaving ? "Leaving…" : "Leave class"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentItem({ assignment, index, state }: { assignment: Assignment; index: number; state: DeliveryState }) {
  return (
    <Link to={`/assignment/${assignment.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors group">
      <div className="relative w-10 h-10 flex-shrink-0 grid place-items-center">
        <svg className="absolute inset-0 w-full h-full text-gray-300 dark:text-gray-700" viewBox="0 0 36 36" fill="none"><polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="currentColor" strokeWidth="1.5" /></svg>
        <span className="text-[10px] font-bold font-mono text-gray-500 dark:text-gray-400">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-azure dark:group-hover:text-yellow transition-colors truncate">{assignment.title}</h3>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${state.className}`}>{state.accepted && <CircleCheck size={12} />}{state.label}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{state.detail}</p>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1"><Clock3 size={10} /> {assignment.timeLimitMs}ms</span>
          <span className="flex items-center gap-1"><HardDrive size={10} /> {assignment.memoryLimitMb}MB</span>
          {assignment.closeDate && <span>Closes {formatDate(assignment.closeDate)}</span>}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
        {assignment.allowedLanguages.slice(0, 3).map((language) => <span key={language} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400">{LANG_ABBR[language]}</span>)}
      </div>
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0" />
    </Link>
  );
}

function DetailCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card px-4 py-3"><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">{icon}{label}</div><p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{value}</p></div>;
}
