import { useEffect, useState } from "react";
import { Link } from "react-router";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import {
  deleteAssignment,
  getActiveTeacherGroups,
  getTeacherAssignments,
} from "../api/assignment.api";
import type { TeacherAssignment, TeacherGroup } from "../api/assignment.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";

export function TeacherAssignmentsPage() {
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [groupId, setGroupId] = useState("");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(assignmentId: string) {
    if (
      !window.confirm(
        "Delete this assignment? Existing history remains stored.",
      )
    )
      return;
    setDeletingId(assignmentId);
    try {
      await deleteAssignment(assignmentId);
      setAssignments((items) =>
        items.filter((item) => item.id !== assignmentId),
      );
      sileo.success({ title: "Assignment deleted." });
    } catch (error) {
      sileo.error({
        title:
          error instanceof Error
            ? error.message
            : "Failed to delete assignment.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void getActiveTeacherGroups()
      .then((activeGroups) => {
        if (cancelled) return;
        setGroups(activeGroups);
        setGroupId(activeGroups[0]?.id ?? "");
        if (!activeGroups.length) setLoading(false);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoading(false);
          sileo.error({
            title:
              error instanceof Error ? error.message : "Failed to load groups.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoading(true);
    void getTeacherAssignments(groupId)
      .then((items) => {
        if (!cancelled) setAssignments(items);
      })
      .catch((error) => {
        if (!cancelled) {
          sileo.error({
            title:
              error instanceof Error
                ? error.message
                : "Failed to load assignments.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  return (
    <DashboardLayout
      logoLinkTo="/teacher"
      navLinks={TEACHER_NAV}
      sidebarItems={TEACHER_SIDEBAR_ITEMS}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Edit assignment details or validate a code and test-suite revision.
          </p>
        </div>
        <Link to="/teacher/create-assignment" className="btn-primary">
          Create Assignment
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <label
          htmlFor="assignmentGroup"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Active group
        </label>
        <select
          id="assignmentGroup"
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
        >
          {!groups.length && (
            <option value="">No active groups available</option>
          )}
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            Loading assignments…
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            No assignments in selected group.
          </div>
        ) : (
          assignments.map((assignment, index) => (
            <div
              key={assignment.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 justify-between px-6 py-5 ${
                index < assignments.length - 1
                  ? "border-b border-gray-100 dark:border-gray-700/50"
                  : ""
              }`}
            >
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {assignment.title}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{assignment.allowedLanguages.join(", ")}</span>
                  <span>•</span>
                  <span>{assignment.validationStatus}</span>
                  {assignment.dueDate && (
                    <>
                      <span>•</span>
                      <span>
                        Due {new Date(assignment.dueDate).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/teacher/assignments/${assignment.id}/preview`}
                  className="btn-outline inline-flex items-center justify-center"
                >
                  Preview
                </Link>
                <Link
                  to={`/teacher/assignments/${assignment.id}/edit`}
                  className="btn-outline inline-flex items-center justify-center"
                >
                  Edit
                </Link>
                <Link
                  to={`/teacher/assignments/${assignment.id}/revalidate`}
                  className="btn-outline inline-flex items-center justify-center"
                >
                  Validate
                </Link>
                <Link
                  to={`/teacher/grades?groupId=${assignment.groupId}&assignmentId=${assignment.id}`}
                  className="btn-outline inline-flex items-center justify-center"
                >
                  Review
                </Link>
                <Link
                  to={`/teacher/assignments/${assignment.id}/clone`}
                  className="btn-outline inline-flex items-center justify-center"
                >
                  Clone
                </Link>
                <button
                  disabled={deletingId === assignment.id}
                  onClick={() => void handleDelete(assignment.id)}
                  className="btn-outline text-red-500"
                >
                  {deletingId === assignment.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
