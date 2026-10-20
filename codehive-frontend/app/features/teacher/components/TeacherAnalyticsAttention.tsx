import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, LoaderCircle } from "lucide-react";
import { Link } from "react-router";

import type { AssignmentMetrics, ExecutionStatus, StudentMetrics } from "../types/metrics.types";
import { ungradedCount } from "./TeacherAnalyticsExplorer";
import { formatPercentage, plural, VERDICT_LABEL, VERDICT_ORDER } from "./TeacherAnalyticsOverview";
import { panelClass } from "./TeacherUI";

/** Each list names its top few items; the tables below hold the rest. */
const LIST_SIZE = 3;

const linkClass = "inline-flex items-center gap-1 rounded text-xs font-medium text-azure underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:focus-visible:ring-yellow";
const rowClass = "group -mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:hover:bg-dark-card/50 dark:focus-visible:ring-yellow";

function dueTime(item: AssignmentMetrics): number {
  return item.dueDate ? Date.parse(item.dueDate) : Number.POSITIVE_INFINITY;
}

/** Assignments with submissions waiting for a grade or a draft grade not yet returned, largest backlog first. */
export function gradingQueue(assignments: AssignmentMetrics[]) {
  return assignments
    .map((item) => ({ item, ungraded: ungradedCount(item) }))
    .filter((row) => row.ungraded > 0 || row.item.draftGrades > 0)
    .sort((left, right) => right.ungraded - left.ungraded
      || right.item.draftGrades - left.item.draftGrades
      || dueTime(left.item) - dueTime(right.item));
}

/** Published assignments students can still submit to and where someone has not, soonest due date first. */
export function openDeadlines(assignments: AssignmentMetrics[], now: number) {
  return assignments
    .filter((item) => item.validationStatus === "READY" && item.missingCount > 0 && item.dueDate
      && (!item.closeDate || Date.parse(item.closeDate) > now))
    .sort((left, right) => dueTime(left) - dueTime(right));
}

/** Students with missing or late work: most missing first, then lowest average score. */
export function studentsToFollowUp(students: StudentMetrics[]) {
  const score = (student: StudentMetrics) => student.averageScore ?? Number.POSITIVE_INFINITY;
  return students
    .filter((student) => student.missingAssignmentIds.length > 0 || student.lateCount > 0)
    .sort((left, right) => right.missingAssignmentIds.length - left.missingAssignmentIds.length
      || score(left) - score(right)
      || right.lateCount - left.lateCount
      || left.fullName.localeCompare(right.fullName));
}

/** Assignments whose evaluated submissions are least often accepted, with the verdict that fails most. */
export function hardestAssignments(assignments: AssignmentMetrics[]) {
  return assignments
    .map((item) => {
      const failures = VERDICT_ORDER
        .filter((status) => status !== "AC" && status !== "PENDING")
        .map((status) => ({ status, count: item.verdictDistribution[status] ?? 0 }))
        .sort((left, right) => right.count - left.count);
      const accepted = item.verdictDistribution.AC ?? 0;
      const evaluated = accepted + failures.reduce((sum, row) => sum + row.count, 0);
      return {
        item, accepted, evaluated,
        rate: evaluated === 0 ? null : accepted / evaluated * 100,
        mainFailure: failures[0]?.count ? failures[0].status : null as ExecutionStatus | null,
      };
    })
    .filter((row): row is typeof row & { rate: number } => row.rate != null && row.rate < 100)
    .sort((left, right) => left.rate - right.rate || right.evaluated - left.evaluated);
}

/**
 * Names the specific work, deadlines, and students that need the teacher,
 * each one click away from where it is handled.
 */
export function AttentionSection({ assignments, students, groupId, onOpenAssignment, onOpenStudent, onShowAssignments, onShowStudents }: {
  assignments: AssignmentMetrics[];
  students: StudentMetrics[];
  groupId: string;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenStudent: (studentId: string) => void;
  onShowAssignments: (filter: "attention" | "overdue" | "grading") => void;
  onShowStudents: (filter: "missing" | "late") => void;
}) {
  const now = Date.now();
  const queue = gradingQueue(assignments);
  const deadlines = openDeadlines(assignments, now);
  const followUp = studentsToFollowUp(students);
  const failed = assignments.filter((item) => item.validationStatus === "FAILED");
  const validating = assignments.filter((item) => item.validationStatus === "PROCESSING");
  const toGrade = queue.reduce((sum, row) => sum + row.ungraded, 0);
  const overdue = assignments.filter((item) => item.overdue && item.missingCount > 0).length;
  const gradebook = (assignmentId?: string) => `/teacher/grades?groupId=${encodeURIComponent(groupId)}${assignmentId ? `&assignmentId=${encodeURIComponent(assignmentId)}` : ""}`;
  const quiet = queue.length + deadlines.length + followUp.length + failed.length + validating.length === 0;

  return (
    <section aria-labelledby="analytics-attention" className={`${panelClass} overflow-hidden`}>
      <h2 id="analytics-attention" className="px-5 pt-5 text-sm font-semibold text-gray-900 dark:text-white">Needs attention</h2>
      {quiet ? (
        <p className="flex items-center gap-2 px-5 pb-5 pt-4 text-sm text-gray-600 dark:text-gray-300">
          <CheckCircle2 size={16} aria-hidden="true" className="shrink-0 text-green-600 dark:text-green-400" />
          Nothing to grade, no open deadlines with pending work, and no students behind.
        </p>
      ) : (
        <>
          {(failed.length > 0 || validating.length > 0) && (
            <ul className="mt-4 space-y-px">
              {failed.length > 0 && (
                <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-red-500/5 px-5 py-2.5 text-sm text-gray-800 dark:text-gray-200">
                  <span className="flex min-w-0 items-start gap-2.5"><AlertTriangle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" /><span><strong className="font-semibold">{nameList(failed)}</strong> failed validation, so students cannot work on {failed.length === 1 ? "it" : "them"}.</span></span>
                  <button type="button" onClick={() => onShowAssignments("attention")} className={linkClass}>Show in table<ArrowRight size={12} aria-hidden="true" /></button>
                </li>
              )}
              {validating.length > 0 && (
                <li className="flex items-start gap-2.5 bg-gray-50 px-5 py-2.5 text-sm text-gray-700 dark:bg-dark-card/40 dark:text-gray-300">
                  <LoaderCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" /><span><strong className="font-semibold">{nameList(validating)}</strong> {validating.length === 1 ? "is" : "are"} still being validated.</span>
                </li>
              )}
            </ul>
          )}
          <div className="grid divide-y divide-gray-100 dark:divide-gray-800/60 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <InsightList
              title="Grading queue"
              summary={toGrade > 0 ? `${toGrade} to grade` : queue.length > 0 ? "Drafts to return" : undefined}
              empty="Nothing waiting for a grade."
              footer={queue.length > 0 && <Link to={gradebook()} className={linkClass}>Open gradebook<ArrowRight size={12} aria-hidden="true" /></Link>}
              more={queue.length - LIST_SIZE}
            >
              {queue.slice(0, LIST_SIZE).map(({ item, ungraded }) => (
                <li key={item.assignmentId}>
                  <Link to={gradebook(item.assignmentId)} className={rowClass} aria-label={`Grade ${item.title}`}>
                    <RowText title={item.title}>
                      {ungraded > 0
                        ? <><Strong>{ungraded}</Strong> to grade{item.draftGrades > 0 && ` · ${item.draftGrades} ${plural(item.draftGrades, "draft")} not returned`}</>
                        : <><Strong>{item.draftGrades}</Strong> {plural(item.draftGrades, "draft")} not returned</>}
                    </RowText>
                  </Link>
                </li>
              ))}
            </InsightList>

            <InsightList
              title="Open deadlines"
              summary={deadlines.length > 0 ? `${deadlines.length} with pending work` : undefined}
              empty="No open assignment has pending submissions."
              footer={overdue > 0 && <button type="button" onClick={() => onShowAssignments("overdue")} className={linkClass}>{overdue} overdue in table<ArrowRight size={12} aria-hidden="true" /></button>}
              more={deadlines.length - LIST_SIZE}
            >
              {deadlines.slice(0, LIST_SIZE).map((item) => {
                const late = dueTime(item) < now;
                return (
                  <li key={item.assignmentId}>
                    <button type="button" onClick={() => onOpenAssignment(item.assignmentId)} className={rowClass}>
                      <RowText title={item.title}>
                        <span className={late ? "font-medium text-orange-700 dark:text-orange-400" : ""}>{relativeDue(item.dueDate!, now)}</span>
                        {" · "}<Strong>{item.missingCount}</Strong> of {item.activeStudents} {late ? "missing" : "pending"}
                      </RowText>
                    </button>
                  </li>
                );
              })}
            </InsightList>

            <InsightList
              title="Students to follow up"
              summary={followUp.length > 0 ? `${followUp.length} of ${students.length}` : undefined}
              empty="No student has missing or late work."
              footer={followUp.length > 0 && <button type="button" onClick={() => onShowStudents("missing")} className={linkClass}>All students with missing work<ArrowRight size={12} aria-hidden="true" /></button>}
              more={followUp.length - LIST_SIZE}
            >
              {followUp.slice(0, LIST_SIZE).map((student) => {
                const missing = student.missingAssignmentIds.length;
                return (
                  <li key={student.studentId}>
                    <button type="button" onClick={() => onOpenStudent(student.studentId)} className={rowClass}>
                      <RowText title={student.fullName}>
                        {missing > 0 && <><Strong>{missing}</Strong> of {student.publishedAssignments} missing</>}
                        {missing > 0 && student.lateCount > 0 && " · "}
                        {student.lateCount > 0 && `${student.lateCount} late`}
                        {student.averageScore != null && ` · avg. ${formatPercentage(student.averageScore)}`}
                      </RowText>
                    </button>
                  </li>
                );
              })}
            </InsightList>
          </div>
        </>
      )}
    </section>
  );
}

/** The assignments where the fewest evaluated submissions are accepted, and what goes wrong there. */
export function StrugglePanel({ assignments, onOpenAssignment }: { assignments: AssignmentMetrics[]; onOpenAssignment: (assignmentId: string) => void }) {
  const hardest = hardestAssignments(assignments);
  const evaluated = assignments.some((item) => VERDICT_ORDER.some((status) => status !== "PENDING" && (item.verdictDistribution[status] ?? 0) > 0));
  return (
    <section aria-labelledby="analytics-struggle" className={`${panelClass} p-5`}>
      <h2 id="analytics-struggle" className="text-sm font-semibold text-gray-900 dark:text-white">Where students struggle</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Assignments with the lowest share of accepted current submissions.</p>
      {hardest.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{evaluated ? "Every evaluated submission is accepted." : "No evaluated submissions yet."}</p>
      ) : (
        <ul className="mt-2">
          {hardest.slice(0, LIST_SIZE).map(({ item, accepted, evaluated: total, rate, mainFailure }) => (
            <li key={item.assignmentId}>
              <button type="button" onClick={() => onOpenAssignment(item.assignmentId)} className={rowClass}>
                <RowText title={item.title}>
                  <Strong>{formatPercentage(rate)}</Strong> accepted ({accepted} of {total})
                  {mainFailure && ` · mostly ${VERDICT_LABEL[mainFailure].toLowerCase()}`}
                  {item.averageAttempts != null && ` · ${Number(item.averageAttempts.toFixed(1))} attempts avg.`}
                </RowText>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function InsightList({ title, summary, empty, footer, more, children }: {
  title: string;
  summary?: string;
  empty: string;
  footer?: ReactNode;
  more: number;
  children: ReactNode[];
}) {
  return (
    <div className="flex min-w-0 flex-col px-5 py-4">
      <h3 className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</span>
        {summary && <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{summary}</span>}
      </h3>
      {children.length === 0
        ? <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{empty}</p>
        : <ul className="mt-1.5">{children}</ul>}
      {(footer || more > 0) && (
        <p className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2">
          {footer || <span />}
          {more > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">+{more} more</span>}
        </p>
      )}
    </div>
  );
}

function RowText({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-gray-900 group-hover:text-azure dark:text-gray-100 dark:group-hover:text-yellow">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">{children}</span>
      </span>
      <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400" />
    </>
  );
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>;
}

function nameList(items: AssignmentMetrics[]): string {
  const names = items.slice(0, 2).map((item) => item.title);
  const rest = items.length - names.length;
  return rest > 0 ? `${names.join(", ")} and ${rest} more` : names.join(" and ");
}

/** "Due in 3 days", "Due tomorrow", "Due 2 weeks ago". */
export function relativeDue(dueDate: string, now: number): string {
  const days = Math.round((Date.parse(dueDate) - now) / 86400000);
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const text = Math.abs(days) >= 14 ? format.format(Math.round(days / 7), "week") : format.format(days, "day");
  return `Due ${text}`;
}
