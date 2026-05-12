export enum Language {
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  CPP = 'CPP',
  C = 'C',
}

export enum ExecutionType {
  PRACTICA = 'PRACTICA',
  DEFINITIVO = 'DEFINITIVO',
}

export type ExecutionRequest = {
  code: string
  language: Language
  requesterId?: number
  assignmentId?: number
  testCases?: string[]
  executionType: ExecutionType
}
