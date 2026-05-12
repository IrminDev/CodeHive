import type { CodeDrafts } from './editor.types'
import type { Language } from './execution.types'

export type DraftSaveRequest = {
  requesterId?: number
  assignmentId?: number
  lastLanguage: Language
  codeDrafts: CodeDrafts
}
