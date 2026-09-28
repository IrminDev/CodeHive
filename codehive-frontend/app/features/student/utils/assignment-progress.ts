import type { Assignment } from "../types/assignment.types";
import type { GroupSubmission } from "../types/group-submission.types";

export type AssignmentProgress = "open" | "inprogress" | "done" | "closed" | "upcoming";

export function assignmentProgress(assignment: Assignment, submission?: GroupSubmission): AssignmentProgress {
  if (submission?.executionStatus === "AC") return "done";
  const now = Date.now();
  if (!assignment.isActive || (assignment.closeDate && Date.parse(assignment.closeDate) <= now)) return "closed";
  if (assignment.launchDate && Date.parse(assignment.launchDate) > now) return "upcoming";
  return submission ? "inprogress" : "open";
}
