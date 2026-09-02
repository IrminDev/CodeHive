import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  FileCheck2,
  GraduationCap,
  Inbox,
  Send,
  Users,
} from "lucide-react";
import { sileo } from "sileo";
import { getExecutionReport } from "~/features/student/api/execution.api";
import type { ExecutionReport } from "~/features/student/types/execution.types";
import { listTeacherGroups } from "../api/group.api";
import {
  getAssignmentMetrics,
  listAssignmentMetrics,
} from "../api/metrics.api";
import {
  createFeedback,
  deleteFeedback,
  getStudentWorkReview,
  getSubmissionEvidence,
  listFeedback,
  returnAllDraftGrades,
  returnGrade,
  saveDraftGrade,
} from "../api/student-work.api";
import { TeacherShell } from "../components/TeacherShell";
import {
  AssignmentCard,
  GradebookToolbar,
  Metric,
  StudentRail,
  Workspace,
  type AssignmentFilter,
} from "../components/TeacherGradebook";
import {
  ConfirmDialog,
  TeacherEmpty,
  TeacherError,
  TeacherLoading,
  TeacherPageHeader,
} from "../components/TeacherUI";
import type { TeacherGroup } from "../types/group.types";
import type {
  AssignmentMetrics,
  AssignmentMetricsDetail,
} from "../types/metrics.types";
import type {
  AssignmentFeedback,
  TeacherStudentWorkReview,
  TeacherSubmissionEvidence,
} from "../types/student-work.types";

type StudentFilter = "all" | "to-grade" | "draft" | "returned" | "missing";
type ReviewTab = "code" | "tests" | "history";

export function TeacherGradesPage() {
  const [params, setParams] = useSearchParams();
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [assignments, setAssignments] = useState<AssignmentMetrics[]>([]);
  const [detail, setDetail] = useState<AssignmentMetricsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("all");
  const [tab, setTab] = useState<ReviewTab>("code");
  const [review, setReview] = useState<TeacherStudentWorkReview | null>(null);
  const [evidence, setEvidence] = useState<TeacherSubmissionEvidence | null>(
    null,
  );
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [feedback, setFeedback] = useState<AssignmentFeedback[]>([]);
  const [feedbackBody, setFeedbackBody] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [savedGrade, setSavedGrade] = useState<number>();
  const [reviewLoading, setReviewLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const groupId = params.get("groupId") ?? "";
  const assignmentId = params.get("assignmentId") ?? "";
  const studentId = params.get("studentId") ?? "";
  const student = detail?.perStudent.find(
    (item) => item.studentId === studentId,
  );
  const assignment =
    assignments.find((item) => item.assignmentId === assignmentId) ?? detail;
  const dirty =
    Boolean(student) &&
    (savedGrade == null
      ? gradeValue !== ""
      : Number(gradeValue) !== savedGrade);
  const navigate = useCallback(
    (group?: string, assignment?: string, student?: string) => {
      const next: Record<string, string> = {};
      if (group) next.groupId = group;
      if (assignment) next.assignmentId = assignment;
      if (student) next.studentId = student;
      setParams(next);
    },
    [setParams],
  );
  const guarded = (action: () => void) => {
    if (!dirty) action();
    else {
      setPendingAction(() => action);
      setDiscardConfirm(true);
    }
  };

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  useEffect(() => {
    let cancelled = false;
    void listTeacherGroups(false)
      .then((items) => {
        const active = items.filter((item) => item.isActive && !item.archived);
        if (!cancelled) {
          setGroups(active);
          if (!active.some((item) => item.id === groupId))
            navigate(active[0]?.id);
        }
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Could not load groups.",
        ),
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const loadAssignments = useCallback(async () => {
    if (!groupId) return setAssignments([]);
    setLoading(true);
    try {
      setAssignments(await listAssignmentMetrics(groupId));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load gradebook.",
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);
  const loadDetail = useCallback(async () => {
    if (!assignmentId) return setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await getAssignmentMetrics(assignmentId));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load assignment.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, [assignmentId]);
  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);
  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);
  const inspect = useCallback(async (id: string) => {
    setReviewLoading(true);
    try {
      const item = await getSubmissionEvidence(id);
      setEvidence(item);
      setReport(
        item.reportAvailable && item.execution?.id
          ? await getExecutionReport(item.execution.id)
          : null,
      );
    } catch (cause) {
      sileo.error({
        title:
          cause instanceof Error ? cause.message : "Could not load evidence.",
      });
    } finally {
      setReviewLoading(false);
    }
  }, []);
  useEffect(() => {
    setReview(null);
    setEvidence(null);
    setReport(null);
    setFeedback([]);
    setTab("code");
    setGradeValue(student?.grade == null ? "" : String(student.grade.value));
    setSavedGrade(student?.grade?.value);
    if (!student?.workId || !assignmentId) return;
    let cancelled = false;
    void Promise.all([
      getStudentWorkReview(assignmentId, student.studentId),
      listFeedback(assignmentId, student.studentId),
    ])
      .then(([work, items]) => {
        if (cancelled) return;
        setReview(work);
        setFeedback(items);
        const id =
          student.currentSubmissionId ?? work.submissions[0]?.submissionId;
        if (id) void inspect(id);
      })
      .catch((cause) => {
        if (!cancelled)
          sileo.error({
            title:
              cause instanceof Error
                ? cause.message
                : "Could not load student.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId, studentId, student?.workId, inspect]);
  async function refresh() {
    await Promise.all([loadAssignments(), loadDetail()]);
  }
  async function save() {
    if (!student || !detail) return;
    const value = Number(gradeValue);
    if (
      !gradeValue ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > detail.maxPoints ||
      (!student.workId && value !== 0)
    )
      return sileo.error({
        title: "Invalid grade. Missing submissions can only receive 0 points.",
      });
    setBusy("save");
    try {
      const grade = await saveDraftGrade(
        assignmentId,
        student.studentId,
        value,
      );
      setSavedGrade(grade.value);
      sileo.success({ title: "Draft saved." });
      await refresh();
    } catch (cause) {
      sileo.error({
        title: cause instanceof Error ? cause.message : "Could not save grade.",
      });
    } finally {
      setBusy(null);
    }
  }
  async function publish() {
    if (!student?.grade || dirty) return;
    setBusy("publish");
    try {
      await returnGrade(assignmentId, student.studentId);
      sileo.success({ title: "Grade published." });
      await refresh();
    } catch (cause) {
      sileo.error({
        title:
          cause instanceof Error ? cause.message : "Could not publish grade.",
      });
    } finally {
      setBusy(null);
    }
  }
  async function publishAll() {
    setBusy("all");
    try {
      const result = await returnAllDraftGrades(assignmentId);
      setBulkConfirm(false);
      sileo.success({
        title: `${result.returnedCount} draft grades published.`,
      });
      await refresh();
    } catch (cause) {
      sileo.error({
        title:
          cause instanceof Error ? cause.message : "Could not publish drafts.",
      });
    } finally {
      setBusy(null);
    }
  }
  async function publishFeedback() {
    if (!student || !feedbackBody.trim()) return;
    setBusy("feedback");
    try {
      const item = await createFeedback(
        assignmentId,
        student.studentId,
        feedbackBody.trim(),
      );
      setFeedback((items) => [...items, item]);
      setFeedbackBody("");
      sileo.success({ title: "Feedback published." });
    } catch (cause) {
      sileo.error({
        title:
          cause instanceof Error
            ? cause.message
            : "Could not publish feedback.",
      });
    } finally {
      setBusy(null);
    }
  }
  async function removeFeedback(item: AssignmentFeedback) {
    setBusy(item.id);
    try {
      await deleteFeedback(item.id);
      setFeedback((items) =>
        items.map((value) =>
          value.id === item.id
            ? { ...value, status: "DELETED", body: undefined }
            : value,
        ),
      );
    } finally {
      setBusy(null);
    }
  }
  const shownAssignments = useMemo(
    () =>
      assignments.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) &&
          (filter === "all" ||
            (filter === "drafts" && item.draftGrades > 0) ||
            (filter === "complete" &&
              item.activeStudents > 0 &&
              item.returnedGrades === item.activeStudents) ||
            (filter === "needs" &&
              item.submittedCount > item.draftGrades + item.returnedGrades)),
      ),
    [assignments, query, filter],
  );
  const shownStudents = useMemo(
    () =>
      (detail?.perStudent ?? []).filter(
        (item) =>
          `${item.fullName} ${item.enrollmentNumber}`
            .toLowerCase()
            .includes(studentQuery.toLowerCase()) &&
          (studentFilter === "all" ||
            (studentFilter === "missing" && !item.currentSubmissionId) ||
            (studentFilter === "to-grade" &&
              item.currentSubmissionId &&
              !item.grade) ||
            (studentFilter === "draft" && item.grade?.status === "DRAFT") ||
            (studentFilter === "returned" &&
              item.grade?.status === "RETURNED")),
      ),
    [detail, studentQuery, studentFilter],
  );

  return (
    <TeacherShell
      active="grades"
      breadcrumbs={[
        { label: "Teacher", to: "/teacher" },
        { label: "Grades" },
        ...(assignment ? [{ label: assignment.title }] : []),
      ]}
      contentClassName="max-w-[1500px]"
    >
      {!assignmentId ? (
        <AssignmentList
          groups={groups}
          groupId={groupId}
          loading={loading}
          error={error}
          assignments={shownAssignments}
          query={query}
          filter={filter}
          onGroup={(id) => guarded(() => navigate(id))}
          onQuery={setQuery}
          onFilter={setFilter}
          onOpen={(id) => guarded(() => navigate(groupId, id))}
          onRetry={() => void loadAssignments()}
        />
      ) : detailLoading && !detail ? (
        <TeacherLoading rows={6} />
      ) : detail ? (
        <>
          <button onClick={() => guarded(() => navigate(groupId))} className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-azure dark:text-gray-400 dark:hover:bg-dark-card dark:hover:text-yellow"><ArrowLeft size={14} /> Assignment gradebook</button>
          <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800/60 dark:bg-dark-surface sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold uppercase tracking-widest text-azure dark:text-yellow">Grading workspace</p>{detail.dueDate && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-gray-500 dark:bg-dark-card"><CalendarClock size={11} /> Due {new Date(detail.dueDate).toLocaleDateString()}</span>}</div>
              <h1 className="mt-2 truncate text-3xl font-bold">{detail.title}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review student evidence, save grades as drafts, then publish completed results.</p>
            </div>
            <button
              disabled={!detail.draftGrades}
              onClick={() => setBulkConfirm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={14} /> Publish all drafts ({detail.draftGrades})
            </button>
          </header>
          <div className="mb-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Metric
              label="Students"
              value={detail.activeStudents}
              icon={<Users size={14} />}
              tone="neutral"
            />
            <Metric
              label="Delivered"
              value={detail.submittedCount}
              icon={<FileCheck2 size={14} />}
              tone="info"
            />
            <Metric
              label="Missing"
              value={detail.missingCount}
              icon={<Inbox size={14} />}
              tone={detail.missingCount ? "error" : "success"}
            />
            <Metric
              label="Drafts"
              value={detail.draftGrades}
              icon={<Clock3 size={14} />}
              tone={detail.draftGrades ? "warning" : "neutral"}
            />
            <Metric
              label="Published"
              value={detail.returnedGrades}
              icon={<GraduationCap size={14} />}
              tone="success"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
            <StudentRail
              students={shownStudents}
              total={detail.perStudent.length}
              selected={studentId}
              query={studentQuery}
              filter={studentFilter}
              onQuery={setStudentQuery}
              onFilter={setStudentFilter}
              onSelect={(id) =>
                guarded(() => navigate(groupId, assignmentId, id))
              }
            />
            {student ? (
              <Workspace
                student={student}
                detail={detail}
                review={review}
                evidence={evidence}
                report={report}
                feedback={feedback}
                feedbackBody={feedbackBody}
                gradeValue={gradeValue}
                dirty={dirty}
                tab={tab}
                loading={reviewLoading}
                busy={busy}
                onTab={setTab}
                onInspect={(id) => void inspect(id)}
                onGrade={setGradeValue}
                onSave={() => void save()}
                onPublish={() => void publish()}
                onFeedback={setFeedbackBody}
                onPublishFeedback={() => void publishFeedback()}
                onDelete={(item) => void removeFeedback(item)}
              />
            ) : (
              <TeacherEmpty
                title="Select a student"
                description="Choose student to inspect delivery and grading history."
              />
            )}
          </div>
        </>
      ) : (
        <TeacherError
          message={error ?? "Assignment unavailable."}
          onRetry={() => void loadDetail()}
        />
      )}
      <ConfirmDialog
        open={bulkConfirm}
        title={`Publish ${detail?.draftGrades ?? 0} draft grades?`}
        description="Every draft becomes visible to students."
        confirmLabel="Publish all drafts"
        busy={busy === "all"}
        onCancel={() => setBulkConfirm(false)}
        onConfirm={() => void publishAll()}
      />
      <ConfirmDialog
        open={discardConfirm}
        title="Discard unsaved grade?"
        description="Continuing discards current grade edit."
        confirmLabel="Discard and continue"
        danger
        onCancel={() => {
          setDiscardConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          const action = pendingAction;
          setDiscardConfirm(false);
          setPendingAction(null);
          action?.();
        }}
      />
    </TeacherShell>
  );
}

function AssignmentList({
  groups,
  groupId,
  loading,
  error,
  assignments,
  query,
  filter,
  onGroup,
  onQuery,
  onFilter,
  onOpen,
  onRetry,
}: {
  groups: TeacherGroup[];
  groupId: string;
  loading: boolean;
  error: string | null;
  assignments: AssignmentMetrics[];
  query: string;
  filter: AssignmentFilter;
  onGroup: (id: string) => void;
  onQuery: (value: string) => void;
  onFilter: (value: AssignmentFilter) => void;
  onOpen: (id: string) => void;
  onRetry: () => void;
}) {
  return (
    <>
      <TeacherPageHeader
        eyebrow="Evaluation"
        title="Grades"
        description="Open assignment to review deliveries, grade students, and publish results."
      />
      <GradebookToolbar groups={groups} groupId={groupId} query={query} filter={filter} onGroup={onGroup} onQuery={onQuery} onFilter={onFilter} />
      {loading ? (
        <TeacherLoading rows={5} />
      ) : error ? (
        <TeacherError message={error} onRetry={onRetry} />
      ) : assignments.length === 0 ? (
        <TeacherEmpty
          title="No assignments found"
          description="Try another filter or group."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((item) => (
            <AssignmentCard
              key={item.assignmentId}
              item={item}
              onClick={() => onOpen(item.assignmentId)}
            />
          ))}
        </div>
      )}
    </>
  );
}
