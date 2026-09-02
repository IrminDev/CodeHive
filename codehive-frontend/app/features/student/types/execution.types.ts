export enum Language {
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  CPP = 'CPP',
  C = 'C',
}

export enum ExecutionType {
  PRACTICE = 'PRACTICE',
  DEFINITIVE = 'DEFINITIVE',
}

export enum ExecutionStatus {
  TLE = 'TLE',
  MLE = 'MLE',
  OLE = 'OLE',
  RTE = 'RTE',
  CE = 'CE',
  WA = 'WA',
  AC = 'AC',
  PENDING = 'PENDING',
}

export type ExecutionRequest = {
  code: string
  language: Language
  requesterId?: string
  assignmentId?: string
  testCases?: string[]
  executionType: ExecutionType
}

export type ExecutionDTO = {
  id: string
  submissionId?: string
  userId?: string
  executionType: ExecutionType
  status: ExecutionStatus
  timeMs?: number
  memoryMb?: number
  isOutdated?: boolean
  createdAt?: string
}

export type TestCaseResult = {
  testCaseNumber: number
  status: ExecutionStatus
  executionTimeMs?: number
  memoryUsedMb?: number
  feedback?: string
  stderr?: string
  exitCode?: number
  expectedOutput?: string | null
  actualOutput?: string | null
}

export type StudentSubmissionHistory = {
  submissionId: string;
  assignmentId: string;
  language: Language;
  submissionStatus: "SUBMITTED" | "WITHDRAWN";
  submittedAt: string;
  deliveredLate: boolean;
  withdrawnAt?: string;
  executionId?: string;
  executionStatus: ExecutionStatus;
  timeMs?: number;
  memoryMb?: number;
  reportAvailable: boolean;
}

export type ExecutionReport = {
  executionId: string
  overallStatus: ExecutionStatus
  testCaseResults: TestCaseResult[]
  totalTests: number
  passedTests: number
  failedTests: number
  totalExecutionTimeMs?: number
  maxExecutionTimeMs?: number
  maxMemoryUsedMb?: number
  compilationError?: string
}
