import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { sileo } from "sileo";

import { getTeacherAssignments } from "../api/assignment.api";
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
import { getGroupMetricsOverview } from "../api/metrics.api";
import {
  AssignmentsPanel,
  EditGroupDialog,
  GroupHero,
  GroupMetrics,
  RosterPanel,
} from "../components/TeacherGroupDetailUI";
import { TeacherShell } from "../components/TeacherShell";
import {
  ConfirmDialog,
  TeacherError,
  TeacherLoading,
} from "../components/TeacherUI";
import type { TeacherAssignment } from "../types/assignment.types";
import type { GroupEnrollment, TeacherGroup } from "../types/group.types";
import type { GroupMetricsOverview } from "../types/metrics.types";

interface Confirmation {
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  action: () => Promise<unknown>;
  redirect?: boolean;
  danger?: boolean;
}

export function TeacherGroupDetailPage() {
  const navigate = useNavigate();
  const { groupId = "" } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<TeacherGroup | null>(null);
  const [students, setStudents] = useState<GroupEnrollment[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [metrics, setMetrics] = useState<GroupMetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [secondaryErrors, setSecondaryErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const load = useCallback(
    async (showLoading = true) => {
      if (!groupId) {
        setFatalError("Group identifier is missing.");
        setLoading(false);
        return;
      }
      if (showLoading) setLoading(true);
      setFatalError(null);
      try {
        const groupResult = await getTeacherGroup(groupId);
        if (!groupResult.isActive) {
          setGroup(null);
          setFatalError("This group is unavailable.");
          return;
        }
        setGroup(groupResult);
        setName(groupResult.name);
        setDescription(groupResult.description ?? "");

        const assignmentRequest = getTeacherAssignments(groupId);
        const [studentResult, assignmentResult, metricsResult] =
          await Promise.allSettled([
            listGroupStudents(groupId),
            assignmentRequest,
            getGroupMetricsOverview(groupId),
          ]);

        const warnings: string[] = [];
        if (studentResult.status === "fulfilled") {
          setStudents(studentResult.value);
        } else {
          setStudents([]);
          warnings.push("roster");
        }
        if (assignmentResult.status === "fulfilled") {
          setAssignments(assignmentResult.value);
        } else {
          setAssignments([]);
          warnings.push("assignments");
        }
        if (metricsResult.status === "fulfilled") {
          setMetrics(metricsResult.value);
        } else {
          setMetrics(null);
          warnings.push("metrics");
        }
        setSecondaryErrors(warnings);
      } catch (cause) {
        setGroup(null);
        setStudents([]);
        setAssignments([]);
        setMetrics(null);
        setFatalError(
          cause instanceof Error ? cause.message : "Failed to load group.",
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [groupId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    action: () => Promise<unknown>,
    successMessage: string,
    redirect = false,
  ): Promise<boolean> {
    setBusy(true);
    try {
      await action();
      sileo.success({ title: successMessage });
      if (redirect) navigate("/teacher/groups");
      else await load(false);
      return true;
    } catch (cause) {
      sileo.error({
        title: cause instanceof Error ? cause.message : "Action failed.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function requestConfirmation(next: Confirmation) {
    setConfirmation(next);
  }

  async function confirmAction() {
    if (!confirmation) return;
    const next = confirmation;
    const succeeded = await runAction(
      next.action,
      next.successMessage,
      next.redirect,
    );
    if (succeeded) setConfirmation(null);
  }

  function resetEditForm() {
    if (group) {
      setName(group.name);
      setDescription(group.description ?? "");
    }
    setEditing(false);
  }

  async function saveGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group || !name.trim()) return;
    const succeeded = await runAction(
      () =>
        updateGroup(group.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      "Group updated.",
    );
    if (succeeded) setEditing(false);
  }

  async function copyJoinCode() {
    if (!group?.joinCode) return;
    try {
      await navigator.clipboard.writeText(group.joinCode);
      sileo.success({ title: "Join code copied." });
    } catch {
      sileo.error({ title: "Could not copy join code." });
    }
  }

  const breadcrumbs = [
    { label: "Teacher", to: "/teacher" },
    { label: "Groups", to: "/teacher/groups" },
    { label: group?.name ?? "Group" },
  ];

  if (loading) {
    return (
      <TeacherShell active="groups" breadcrumbs={breadcrumbs}>
        <TeacherLoading rows={4} />
      </TeacherShell>
    );
  }

  if (fatalError || !group) {
    return (
      <TeacherShell active="groups" breadcrumbs={breadcrumbs}>
        <TeacherError
          message={fatalError ?? "This group is unavailable."}
          onRetry={() => void load()}
        />
      </TeacherShell>
    );
  }

  return (
    <TeacherShell active="groups" breadcrumbs={breadcrumbs}>
      <Link
        to="/teacher/groups"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"
      >
        <ArrowLeft size={14} /> All groups
      </Link>

      <div className="space-y-5">
        <GroupHero
          group={group}
          busy={busy}
          onCopyCode={() => void copyJoinCode()}
          onEdit={() => setEditing(true)}
          onRotateCode={() =>
            requestConfirmation({
              title: "Rotate join code?",
              description:
                "Current code will stop working immediately. Students will need new code to join.",
              confirmLabel: "Rotate code",
              successMessage: "Join code rotated.",
              action: () => rotateGroupJoinCode(group.id),
            })
          }
          onArchiveToggle={() =>
            requestConfirmation({
              title: group.archived ? "Unarchive group?" : "Archive group?",
              description: group.archived
                ? "Group becomes writable again and students regain access."
                : "Students lose access while roster, assignments, and history remain stored.",
              confirmLabel: group.archived
                ? "Unarchive group"
                : "Archive group",
              successMessage: group.archived
                ? "Group unarchived."
                : "Group archived.",
              action: () =>
                group.archived
                  ? unarchiveGroup(group.id)
                  : archiveGroup(group.id),
            })
          }
          onDelete={() =>
            requestConfirmation({
              title: "Delete group?",
              description:
                "Students lose access. Group history remains stored and can be restored later.",
              confirmLabel: "Delete group",
              successMessage: "Group deleted.",
              action: () => deleteGroup(group.id),
              redirect: true,
              danger: true,
            })
          }
          onRestore={() =>
            requestConfirmation({
              title: "Restore group?",
              description:
                "Group returns in archived state. Unarchive it when students should regain access.",
              confirmLabel: "Restore group",
              successMessage: "Group restored in archived state.",
              action: () => restoreGroup(group.id),
            })
          }
        />

        {secondaryErrors.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-600 dark:text-orange-400">
            <CircleAlert size={15} className="mt-0.5 flex-shrink-0" />
            <p>
              Could not load {secondaryErrors.join(", ")}. Remaining group data
              is still available.
              <button
                onClick={() => void load(false)}
                className="ml-1 font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            </p>
          </div>
        )}

        <GroupMetrics
          metrics={metrics}
          studentCount={
            secondaryErrors.includes("roster") ? null : students.length
          }
          assignmentCount={
            secondaryErrors.includes("assignments") ? null : assignments.length
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-5 items-start">
          <RosterPanel
            group={group}
            students={students}
            busy={busy}
            onRemove={(enrollment) =>
              requestConfirmation({
                title: `Remove ${enrollment.student.fullName}?`,
                description:
                  "Student loses class access. Enrollment history remains stored and returns if student rejoins.",
                confirmLabel: "Remove student",
                successMessage: "Student removed.",
                action: () =>
                  removeGroupStudent(group.id, enrollment.student.id),
                danger: true,
              })
            }
          />
          <AssignmentsPanel group={group} assignments={assignments} />
        </div>
      </div>

      <EditGroupDialog
        open={editing}
        name={name}
        description={description}
        busy={busy}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onCancel={resetEditForm}
        onSubmit={(event) => void saveGroup(event)}
      />

      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "Confirm action"}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel ?? "Confirm"}
        busy={busy}
        danger={confirmation?.danger}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void confirmAction()}
      />
    </TeacherShell>
  );
}
