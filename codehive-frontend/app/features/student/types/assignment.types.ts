export type ComparatorType = "EXACT_MATCH" | "FLOATING_POINT";
export type Language = "JAVA" | "PYTHON" | "CPP" | "C";

export interface SampleTestCase {
  order: number;
  input: string;
}

export interface Assignment {
  id: string;
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
  dueDate?: string;
  allowedLanguages: Language[];
  isActive: boolean;
  sampleTestCases?: SampleTestCase[];
}

export interface AssignmentPage {
  content: Assignment[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
