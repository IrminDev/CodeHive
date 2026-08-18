import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Archive, ArrowLeft, Copy, Pencil, Plus, RefreshCw, RotateCcw, Trash2, UserMinus } from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import {
  archiveGroup,
  deleteGroup,
  getTeacherGroup,
  listGroupStudents,
  removeGroupStudent,
  restoreGroup,
  rotateGroupJoinCode,
  unarchiveGroup,
  updateGroup,
} from "../api/group.api";
import { getTeacherAssignments } from "../api/assignment.api";
import { getGroupMetricsOverview } from "../api/metrics.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type { TeacherAssignment } from "../types/assignment.types";
import type { GroupEnrollment, TeacherGroup } from "../types/group.types";
import type { GroupMetricsOverview } from "../types/metrics.types";

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function TeacherGroupDetailPage() {
  const navigate = useNavigate();
  const { groupId = "" } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<TeacherGroup | null>(null);
  const [students, setStudents] = useState<GroupEnrollment[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [metrics, setMetrics] = useState<GroupMetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const groupResult = await getTeacherGroup(groupId);
      setGroup(groupResult);
      setName(groupResult.name);
      setDescription(groupResult.description ?? "");
      const [studentResult, assignmentResult, metricsResult] = await Promise.allSettled([
        groupResult.isActive ? listGroupStudents(groupId) : Promise.resolve([]),
        groupResult.isActive ? getTeacherAssignments(groupId) : Promise.resolve([]),
        groupResult.isActive ? getGroupMetricsOverview(groupId) : Promise.resolve(null),
      ]);
      setStudents(studentResult.status === "fulfilled" ? studentResult.value : []);
      setAssignments(assignmentResult.status === "fulfilled" ? assignmentResult.value : []);
      setMetrics(metricsResult.status === "fulfilled" ? metricsResult.value : null);
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to load group." });
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  async function runAction(action: () => Promise<unknown>, success: string, redirect = false) {
    setBusy(true);
    try {
      await action();
      sileo.success({ title: success });
      if (redirect) navigate("/teacher/groups");
      else await load();
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Action failed." });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">Loading group…</div>;
  }
  if (!group) {
    return <div className="min-h-screen bg-gray-50 dark:bg-dark-bg grid place-items-center text-gray-500">Group not found.</div>;
  }

  const state = !group.isActive ? "Deleted" : group.archived ? "Archived" : "Active";

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate("/teacher/groups")} className="btn-outline p-2.5" aria-label="Back to groups">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <span className="text-xs font-semibold text-azure dark:text-yellow">{state}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{group.description || "No description"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.isActive && !group.archived && (
            <button disabled={busy} onClick={() => setEditing((value) => !value)} className="btn-outline inline-flex items-center gap-2">
              <Pencil size={14} /> Edit
            </button>
          )}
          {group.isActive && !group.archived && (
            <button disabled={busy} onClick={() => void runAction(() => rotateGroupJoinCode(group.id), "Join code rotated.")} className="btn-outline inline-flex items-center gap-2">
              <RefreshCw size={14} /> Rotate code
            </button>
          )}
          {group.isActive && (
            <button
              disabled={busy}
              onClick={() => void runAction(
                () => group.archived ? unarchiveGroup(group.id) : archiveGroup(group.id),
                group.archived ? "Group unarchived." : "Group archived.",
              )}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Archive size={14} /> {group.archived ? "Unarchive" : "Archive"}
            </button>
          )}
          {!group.isActive ? (
            <button disabled={busy} onClick={() => void runAction(() => restoreGroup(group.id), "Group restored in archived state.")} className="btn-primary">
              Restore
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm("Delete this group? History remains stored, but students lose access.")) {
                  void runAction(() => deleteGroup(group.id), "Group deleted.", true);
                }
              }}
              className="btn-outline inline-flex items-center gap-2 text-red-500"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {editing && (
        <form
          className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5 mb-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void runAction(
              () => updateGroup(group.id, { name: name.trim(), description: description.trim() || undefined }),
              "Group updated.",
            ).then(() => setEditing(false));
          }}
        >
          <label className="grid gap-1 text-sm">Name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700" /></label>
          <label className="grid gap-1 text-sm">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700" /></label>
          <div><button disabled={busy || !name.trim()} className="btn-primary">Save group</button></div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
            <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700/40 flex items-center justify-between">
              <h2 className="font-semibold">Student roster</h2>
              <span className="text-sm text-gray-500">{students.length} active</span>
            </header>
            {students.length === 0 ? <p className="p-8 text-center text-gray-500">No active students.</p> : students.map((enrollment) => (
              <div key={enrollment.id} className="px-5 py-4 border-b last:border-0 border-gray-100 dark:border-gray-700/30 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{enrollment.student.fullName}</p>
                  <p className="text-xs text-gray-500 font-mono">{enrollment.student.enrollmentNumber}</p>
                </div>
                <span className="text-xs text-gray-500">Joined {formatDate(enrollment.joinedAt)}</span>
                <button
                  disabled={busy || group.archived}
                  onClick={() => {
                    if (window.confirm(`Remove ${enrollment.student.fullName} from group?`)) {
                      void runAction(
                        () => removeGroupStudent(group.id, enrollment.student.id),
                        "Student removed.",
                      );
                    }
                  }}
                  className="text-red-500 disabled:opacity-40"
                  title="Remove student"
                ><UserMinus size={16} /></button>
              </div>
            ))}
          </section>

          <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
            <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700/40 flex items-center justify-between">
              <h2 className="font-semibold">Assignments</h2>
              {group.isActive && !group.archived && <Link to={`/teacher/create-assignment?groupId=${group.id}`} className="btn-primary inline-flex items-center gap-1.5"><Plus size={14} /> New</Link>}
            </header>
            {assignments.length === 0 ? <p className="p-8 text-center text-gray-500">No assignments.</p> : assignments.map((assignment) => (
              <Link key={assignment.id} to={`/teacher/grades?groupId=${group.id}&assignmentId=${assignment.id}`} className="px-5 py-4 border-b last:border-0 border-gray-100 dark:border-gray-700/30 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-dark-surface/40">
                <span className="flex-1 font-medium">{assignment.title}</span>
                <span className="text-xs text-gray-500">{assignment.validationStatus}</span>
                <span className="text-xs text-gray-500">{assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : "No due date"}</span>
              </Link>
            ))}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5">
            <p className="text-xs uppercase tracking-widest text-gray-500">Join code</p>
            <div className="flex items-center gap-2 mt-3">
              <strong className="font-mono text-xl tracking-widest text-azure dark:text-yellow flex-1">{group.joinCode || "Unavailable"}</strong>
              {group.joinCode && <button onClick={() => void navigator.clipboard.writeText(group.joinCode!)} title="Copy join code"><Copy size={16} /></button>}
              {group.isActive && !group.archived && <button disabled={busy} onClick={() => void runAction(() => rotateGroupJoinCode(group.id), "Join code rotated.")} title="Rotate join code"><RotateCcw size={16} /></button>}
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5 space-y-3 text-sm">
            <h2 className="font-semibold">Overview</h2>
            <div className="flex justify-between"><span className="text-gray-500">Active students</span><strong>{metrics?.enrollment.active ?? students.length}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Assignments</span><strong>{metrics?.assignments.total ?? assignments.length}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Submission rate</span><strong>{metrics?.overallSubmissionRate == null ? "—" : `${metrics.overallSubmissionRate}%`}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Average score</span><strong>{metrics?.overallAverageScore == null ? "—" : `${metrics.overallAverageScore}%`}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Created</span><strong>{formatDate(group.createdAt)}</strong></div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
