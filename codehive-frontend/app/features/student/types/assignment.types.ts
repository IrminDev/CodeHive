export type ComparatorType = "EXACT_MATCH" | "FLOATING_POINT";
export type Language = "JAVA" | "PYTHON" | "CPP" | "C";

export interface SampleTestCase {
  order: number;
  input: string;
}

export type ValidationStatus = "PROCESSING" | "READY" | "FAILED";

export interface Assignment {
  id: string;
  groupId: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  maxPoints: number;
  comparatorType: ComparatorType;
  createdAt: string;
  updatedAt: string;
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
  allowedLanguages: Language[];
  isActive: boolean;
  validationStatus?: ValidationStatus;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  sampleTestCases?: SampleTestCase[];
}

export type StudentWorkStatus = "NOT_SUBMITTED" | "SUBMITTED";
export type GradeStatus = "DRAFT" | "RETURNED";

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
  body: string;
  status: "PUBLISHED" | "DELETED";
  createdAt: string;
  deletedAt?: string;
}

export interface StudentAssignmentOverview {
  assignment: Assignment;
  groupId: string;
  groupName: string;
  groupArchived: boolean;
  workStatus: StudentWorkStatus;
  currentSubmission?: import("./group-submission.types").GroupSubmission;
  grade?: AssignmentGrade;
  feedbackCount: number;
}

export interface AssignmentPage {
  content: Assignment[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
