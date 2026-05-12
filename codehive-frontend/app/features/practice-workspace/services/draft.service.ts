import { defaultAssignmentId, defaultRequesterId } from '../data'
import type { CodeDrafts } from '../types/editor.types'
import type { DraftSaveRequest } from '../types/draft.types'
import type { Language } from '../types/execution.types'

export type BuildDraftSaveRequestInput = {
  lastLanguage: Language
  codeDrafts: CodeDrafts
  requesterId?: number
  assignmentId?: number
}

export function buildDraftSaveRequest(
  input: BuildDraftSaveRequestInput,
): DraftSaveRequest {
  return {
    requesterId: input.requesterId ?? defaultRequesterId,
    assignmentId: input.assignmentId ?? defaultAssignmentId,
    lastLanguage: input.lastLanguage,
    codeDrafts: input.codeDrafts,
  }
}
