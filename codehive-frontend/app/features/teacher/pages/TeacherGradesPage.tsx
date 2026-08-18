import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { MessageSquare, RotateCcw, Send, Trash2 } from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { getTeacherAssignments } from "../api/assignment.api";
import { listGroupStudents, listTeacherGroups } from "../api/group.api";
import {
  createFeedback,
  deleteFeedback,
  listFeedback,
  listStudentWork,
  returnGrade,
  saveDraftGrade,
} from "../api/student-work.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type { TeacherAssignment } from "../types/assignment.types";
import type { GroupEnrollment, TeacherGroup } from "../types/group.types";
import type { AssignmentFeedback, StudentAssignmentWork } from "../types/student-work.types";

export function TeacherGradesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [roster, setRoster] = useState<GroupEnrollment[]>([]);
  const [works, setWorks] = useState<StudentAssignmentWork[]>([]);
  const [feedback, setFeedback] = useState<Record<string, AssignmentFeedback[]>>({});
  const [gradeValues, setGradeValues] = useState<Record<string, string>>({});
  const [feedbackBodies, setFeedbackBodies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const groupId = searchParams.get("groupId") ?? "";
  const assignmentId = searchParams.get("assignmentId") ?? "";

  useEffect(() => {
    let cancelled = false;
    void listTeacherGroups(false)
      .then((items) => {
        if (cancelled) return;
        const active = items.filter((group) => group.isActive && !group.archived);
        setGroups(active);
        const selected = active.some((group) => group.id === groupId) ? groupId : active[0]?.id ?? "";
        if (selected !== groupId) setSearchParams(selected ? { groupId: selected } : {});
        if (!selected) setLoading(false);
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load groups." });
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([getTeacherAssignments(groupId), listGroupStudents(groupId)])
      .then(([assignmentItems, enrollmentItems]) => {
        if (cancelled) return;
        setAssignments(assignmentItems);
        setRoster(enrollmentItems);
        const selected = assignmentItems.some((item) => item.id === assignmentId)
          ? assignmentId
          : assignmentItems[0]?.id ?? "";
        if (selected !== assignmentId) {
          setSearchParams(selected ? { groupId, assignmentId: selected } : { groupId });
        }
        if (!selected) {
          setWorks([]);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load gradebook." });
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [groupId]);

  useEffect(() => {
    if (!assignmentId) return;
    let cancelled = false;
    setLoading(true);
    setFeedback({});
    void listStudentWork(assignmentId)
      .then((items) => {
        if (cancelled) return;
        setWorks(items);
        setGradeValues(Object.fromEntries(items.map((work) => [work.studentId, work.grade?.value?.toString() ?? ""])));
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load student work." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [assignmentId]);

  const selectedAssignment = assignments.find((item) => item.id === assignmentId);
  const workByStudent = useMemo(
    () => new Map(works.map((work) => [work.studentId, work])),
    [works],
  );

  function selectGroup(nextGroupId: string) {
    setSearchParams(nextGroupId ? { groupId: nextGroupId } : {});
  }

  function selectAssignment(nextAssignmentId: string) {
    setSearchParams(nextAssignmentId ? { groupId, assignmentId: nextAssignmentId } : { groupId });
  }

  async function saveGrade(studentId: string) {
    const value = Number(gradeValues[studentId]);
    if (!Number.isFinite(value) || value < 0) {
      sileo.error({ title: "Enter a valid nonnegative grade." });
      return;
    }
    setBusyKey(`grade-${studentId}`);
    try {
      const grade = await saveDraftGrade(assignmentId, studentId, value);
      setWorks((items) => items.map((work) => work.studentId === studentId ? { ...work, grade } : work));
      sileo.success({ title: "Draft grade saved." });
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to save grade." });
    } finally {
      setBusyKey(null);
    }
  }

  async function publishGrade(studentId: string) {
    setBusyKey(`return-${studentId}`);
    try {
      const grade = await returnGrade(assignmentId, studentId);
      setWorks((items) => items.map((work) => work.studentId === studentId ? { ...work, grade } : work));
      sileo.success({ title: "Grade returned to student." });
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to return grade." });
    } finally {
      setBusyKey(null);
    }
  }

  async function publishFeedback(studentId: string) {
    const body = feedbackBodies[studentId]?.trim();
    if (!body) return;
    setBusyKey(`feedback-${studentId}`);
    try {
      const item = await createFeedback(assignmentId, studentId, body);
      setFeedback((current) => ({ ...current, [studentId]: [...(current[studentId] ?? []), item] }));
      setFeedbackBodies((current) => ({ ...current, [studentId]: "" }));
      sileo.success({ title: "Feedback published." });
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to publish feedback." });
    } finally {
      setBusyKey(null);
    }
  }

  async function loadFeedback(studentId: string) {
    setBusyKey(`list-${studentId}`);
    try {
      const items = await listFeedback(assignmentId, studentId);
      setFeedback((current) => ({ ...current, [studentId]: items }));
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to load feedback." });
    } finally {
      setBusyKey(null);
    }
  }

  async function removeFeedback(studentId: string, feedbackId: string) {
    setBusyKey(`delete-${feedbackId}`);
    try {
      await deleteFeedback(feedbackId);
      setFeedback((current) => ({
        ...current,
        [studentId]: (current[studentId] ?? []).map((item) =>
          item.id === feedbackId ? { ...item, status: "DELETED", body: undefined } : item,
        ),
      }));
      sileo.success({ title: "Feedback deleted." });
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to delete feedback." });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <div className="mb-7"><p className="text-xs uppercase tracking-widest font-semibold text-azure dark:text-yellow">Evaluation</p><h1 className="text-3xl font-bold mt-2">Grades and feedback</h1><p className="text-gray-500 mt-1">Save drafts, return grades, and publish student feedback.</p></div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <label className="grid gap-2 text-sm">Group<select value={groupId} onChange={(event) => selectGroup(event.target.value)} className="px-4 py-3 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700"><option value="">No active group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Assignment<select value={assignmentId} onChange={(event) => selectAssignment(event.target.value)} className="px-4 py-3 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700"><option value="">No assignment</option>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}</select></label>
      </div>

      <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
        <header className="p-5 border-b border-gray-200 dark:border-gray-700/40 flex justify-between"><h2 className="font-semibold">{selectedAssignment?.title ?? "Student work"}</h2><span className="text-sm text-gray-500">Max {selectedAssignment?.maxPoints ?? 0} points</span></header>
        {loading ? <p className="p-10 text-center text-gray-500">Loading gradebook…</p> : !assignmentId ? <p className="p-10 text-center text-gray-500">Select assignment.</p> : roster.length === 0 ? <p className="p-10 text-center text-gray-500">No active students.</p> : roster.map((enrollment) => {
          const studentId = enrollment.student.id;
          const work = workByStudent.get(studentId);
          const studentFeedback = feedback[studentId];
          return <div key={enrollment.id} className="p-5 border-b last:border-0 border-gray-100 dark:border-gray-700/30 grid gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1"><p className="font-medium">{enrollment.student.fullName}</p><p className="text-xs text-gray-500 font-mono">{enrollment.student.enrollmentNumber} · {work?.status ?? "NOT_STARTED"}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="number" min={0} max={selectedAssignment?.maxPoints} step="0.01" disabled={!work} value={gradeValues[studentId] ?? ""} onChange={(event) => setGradeValues((current) => ({ ...current, [studentId]: event.target.value }))} placeholder="Grade" className="w-28 px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 disabled:opacity-40" />
                <button disabled={!work || busyKey === `grade-${studentId}`} onClick={() => void saveGrade(studentId)} className="btn-outline">Save draft</button>
                <button disabled={!work?.grade || busyKey === `return-${studentId}`} onClick={() => void publishGrade(studentId)} className="btn-primary inline-flex items-center gap-1"><Send size={13} /> Return</button>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-2">
              <textarea maxLength={10000} value={feedbackBodies[studentId] ?? ""} onChange={(event) => setFeedbackBodies((current) => ({ ...current, [studentId]: event.target.value }))} placeholder="Feedback visible immediately to student" rows={2} className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700" />
              <button disabled={!feedbackBodies[studentId]?.trim() || busyKey === `feedback-${studentId}`} onClick={() => void publishFeedback(studentId)} className="btn-outline inline-flex items-center justify-center gap-1"><MessageSquare size={14} /> Publish</button>
              <button disabled={busyKey === `list-${studentId}`} onClick={() => void loadFeedback(studentId)} className="btn-outline inline-flex items-center justify-center gap-1"><RotateCcw size={14} /> {studentFeedback ? "Refresh" : "Show history"}</button>
            </div>
            {studentFeedback && <div className="grid gap-2">{studentFeedback.length === 0 ? <p className="text-sm text-gray-500">No feedback yet.</p> : studentFeedback.map((item) => <div key={item.id} className="p-3 rounded-lg bg-gray-50 dark:bg-dark-surface flex gap-3"><p className="flex-1 text-sm">{item.status === "DELETED" ? <em className="text-gray-500">Deleted feedback</em> : item.body}</p>{item.status !== "DELETED" && <button disabled={busyKey === `delete-${item.id}`} onClick={() => void removeFeedback(studentId, item.id)} className="text-red-500"><Trash2 size={14} /></button>}</div>)}</div>}
          </div>;
        })}
      </section>
    </DashboardLayout>
  );
}
