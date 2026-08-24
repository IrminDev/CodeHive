import { jsonRequest, teacherRequest } from "./client";
import type {
  AssignmentFeedback,
  AssignmentGrade,
  StudentAssignmentWork,
  TeacherStudentWorkReview,
  TeacherSubmissionEvidence,
} from "../types/student-work.types";
import type { ExecutionReport } from "~/features/student/types/execution.types";

const assignmentPath = (assignmentId: string) =>
  `/api/assignments/${encodeURIComponent(assignmentId)}`;
const studentPath = (assignmentId: string, studentId: string) =>
  `${assignmentPath(assignmentId)}/students/${encodeURIComponent(studentId)}`;

export function listStudentWork(assignmentId: string): Promise<StudentAssignmentWork[]> {
  return teacherRequest<StudentAssignmentWork[]>(`${assignmentPath(assignmentId)}/student-work`);
}

export function getStudentWork(assignmentId: string, studentId: string): Promise<StudentAssignmentWork> {
  return teacherRequest<StudentAssignmentWork>(`${studentPath(assignmentId, studentId)}/work`);
}

export function getStudentWorkReview(assignmentId: string, studentId: string): Promise<TeacherStudentWorkReview> {
  return teacherRequest<TeacherStudentWorkReview>(`${studentPath(assignmentId, studentId)}/review`);
}

export function getSubmissionEvidence(submissionId: string): Promise<TeacherSubmissionEvidence> {
  return teacherRequest<TeacherSubmissionEvidence>(
    `/api/assignments/submissions/${encodeURIComponent(submissionId)}/teacher-review`,
  );
}

export function getSubmissionReport(executionId: string): Promise<ExecutionReport> {
  return teacherRequest<ExecutionReport>(
    `/api/execution/check/${encodeURIComponent(executionId)}/report`,
  );
}

export function createFeedback(
  assignmentId: string,
  studentId: string,
  body: string,
): Promise<AssignmentFeedback> {
  return teacherRequest<AssignmentFeedback>(`${studentPath(assignmentId, studentId)}/feedback`, {
    method: "POST",
    ...jsonRequest({ body }),
  });
}

export function listFeedback(assignmentId: string, studentId: string): Promise<AssignmentFeedback[]> {
  return teacherRequest<AssignmentFeedback[]>(`${studentPath(assignmentId, studentId)}/feedback`);
}

export function deleteFeedback(feedbackId: string): Promise<void> {
  return teacherRequest<void>(`/api/assignments/feedback/${encodeURIComponent(feedbackId)}`, {
    method: "DELETE",
  });
}

export function saveDraftGrade(
  assignmentId: string,
  studentId: string,
  value: number,
): Promise<AssignmentGrade> {
  return teacherRequest<AssignmentGrade>(`${studentPath(assignmentId, studentId)}/grade`, {
    method: "PUT",
    ...jsonRequest({ value }),
  });
}

export function returnGrade(assignmentId: string, studentId: string): Promise<AssignmentGrade> {
  return teacherRequest<AssignmentGrade>(`${studentPath(assignmentId, studentId)}/grade/return`, {
    method: "POST",
  });
}

export function returnAllDraftGrades(assignmentId: string): Promise<{ assignmentId: string; returnedCount: number }> {
  return teacherRequest<{ assignmentId: string; returnedCount: number }>(
    `${assignmentPath(assignmentId)}/grades/return-drafts`,
    { method: "POST" },
  );
}
