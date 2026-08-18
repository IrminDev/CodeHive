export type ComparatorType = "EXACT_MATCH" | "FLOATING_POINT";
export type Language = "JAVA" | "PYTHON" | "CPP" | "C";
export type AssignmentValidationStatus = "PROCESSING" | "READY" | "FAILED";
export type AssignmentUpdateStatus = "VALIDATING" | "APPLIED" | "REJECTED";
export type AssignmentUpdateKind = "METADATA" | "REFERENCE_ONLY" | "TEST_SUITE";
export type TestSuiteUpdateMode = "APPEND" | "REPLACE";

export interface AssignmentExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface SampleTestCase {
  order: number;
  input: string;
}

export interface TeacherAssignment {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  comparatorType: ComparatorType;
  createdAt: string;
  updatedAt: string;
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
  allowedLanguages: Language[];
  isActive: boolean;
  validationStatus: AssignmentValidationStatus;
  examples?: AssignmentExample[];
  sampleTestCases?: SampleTestCase[];
  maxPoints: number;
  activeTestSuiteRevisionId?: string;
  activeReferenceSolutionRevisionId?: string;
}

export interface AssignmentPage {
  content: TeacherAssignment[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface CreateAssignmentMetadata {
  groupId: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  comparatorType: ComparatorType;
  allowedLanguages: Language[];
  referenceLanguage: Language;
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
  examples: AssignmentExample[];
  maxPoints: number;
  sampleFlags: boolean[];
}

export interface CloneAssignmentForm {
  sourceGroupId: string;
  title: string;
  description: string;
  constraints: string[];
  hints: string[];
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  comparatorType: ComparatorType;
  allowedLanguages: Language[];
  referenceLanguage: Language;
  referenceSolution: string;
  examples: AssignmentExample[];
  testCases: Array<{ order: number; input: string; sample: boolean }>;
  maxPoints: number;
}

export interface CloneAssignmentPayload extends Omit<CloneAssignmentForm, "sourceGroupId" | "testCases"> {
  targetGroupId: string;
  testCases: Array<{ input: string; sample: boolean }>;
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
}

export interface UpdateAssignmentMetadata {
  title?: string;
  description?: string;
  constraints?: string[];
  hints?: string[];
  tags?: string[];
  timeLimitMs?: number;
  memoryLimitMb?: number;
  comparatorType?: ComparatorType;
  allowedLanguages?: Language[];
  referenceLanguage?: Language;
  launchDate?: string;
  dueDate?: string;
  closeDate?: string;
  clearLaunchDate?: boolean;
  clearDueDate?: boolean;
  clearCloseDate?: boolean;
  maxPoints?: number;
  examples?: AssignmentExample[];
  sampleFlags?: boolean[];
  testSuiteUpdateMode?: TestSuiteUpdateMode;
}

export interface AssignmentUpdate {
  id: string;
  assignmentId: string;
  kind: AssignmentUpdateKind;
  status: AssignmentUpdateStatus;
  failureMessage?: string;
  createdAt: string;
  completedAt?: string;
}
