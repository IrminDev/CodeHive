import type { Language } from "./assignment.types";

export type StudentWorkStatus = "NOT_SUBMITTED" | "SUBMITTED" | "WITHDRAWN" | "RETURNED";
export type SubmissionStatus = "SUBMITTED" | "WITHDRAWN" | "SUPERSEDED";
export type GradeStatus = "DRAFT" | "RETURNED";
export type FeedbackStatus = "PUBLISHED" | "DELETED";

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  language: Language;
  createdAt: string;
  deliveredLate: boolean;
  studentWorkId: string;
  status: SubmissionStatus;
  withdrawnAt?: string;
}

export interface AssignmentGrade {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionId?: string;
  value: number;
  maxPoints: number;
  status: GradeStatus;
  updatedAt: string;
  returnedAt?: string;
}

export interface AssignmentFeedback {
  id: string;
  assignmentId: string;
  studentId: string;
  authorId: string;
  body?: string;
  status: FeedbackStatus;
  createdAt: string;
  deletedAt?: string;
}

export interface StudentAssignmentWork {
  id: string;
  assignmentId: string;
  studentId: string;
  currentSubmissionId?: string;
  status: StudentWorkStatus;
  grade?: AssignmentGrade;
  submissions: Submission[];
  updatedAt: string;
}
