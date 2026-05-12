import {
  type ExecutionRequest,
  ExecutionType,
  type Language,
} from '../types/execution.types'

import { defaultAssignmentId, defaultRequesterId } from '../data'

export type BuildExecutionRequestInput = {
  code: string
  language: Language
  executionType: ExecutionType
  testCases: string[]
  requesterId?: number
  assignmentId?: number
}

export function buildExecutionRequest(
  input: BuildExecutionRequestInput,
): ExecutionRequest {
  const requesterId = input.requesterId ?? defaultRequesterId
  const assignmentId = input.assignmentId ?? defaultAssignmentId

  const base: ExecutionRequest = {
    code: input.code,
    language: input.language,
    requesterId,
    assignmentId,
    executionType: input.executionType,
  }

  if (input.executionType === ExecutionType.PRACTICA) {
    const testCases = input.testCases
      .map((testCase) => testCase.trim())
      .filter((testCase) => testCase.length > 0)

    return { ...base, testCases }
  }

  return base
}
