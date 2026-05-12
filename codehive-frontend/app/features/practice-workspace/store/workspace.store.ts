import { create } from 'zustand'

import { initialTestCases, languageTemplateMap } from '../data'
import type { CodeDrafts } from '../types/editor.types'
import { ExecutionType, Language } from '../types/execution.types'

export type WorkspaceState = {
  code: string
  codeDrafts: CodeDrafts
  language: Language
  executionType: ExecutionType
  testCases: string[]
  selectedTestCase: number
  isEditorExpanded: boolean

  setCode: (code: string) => void
  setLanguage: (language: Language) => void
  setExecutionType: (executionType: ExecutionType) => void
  setEditorExpanded: (isEditorExpanded: boolean) => void
  toggleEditorExpanded: () => void
  addTestCase: () => void
  removeTestCase: (index: number) => void
  updateTestCase: (index: number, value: string) => void
  setSelectedTestCase: (index: number) => void
  resetWorkspace: () => void
}

const initialDrafts: CodeDrafts = {
  [Language.PYTHON]: languageTemplateMap[Language.PYTHON],
  [Language.JAVA]: languageTemplateMap[Language.JAVA],
  [Language.CPP]: languageTemplateMap[Language.CPP],
  [Language.C]: languageTemplateMap[Language.C],
}

const initialState: Pick<
  WorkspaceState,
  | 'code'
  | 'codeDrafts'
  | 'language'
  | 'executionType'
  | 'testCases'
  | 'selectedTestCase'
  | 'isEditorExpanded'
> = {
  language: Language.PYTHON,
  codeDrafts: initialDrafts,
  code: initialDrafts[Language.PYTHON],
  executionType: ExecutionType.PRACTICA,
  testCases: initialTestCases,
  selectedTestCase: 0,
  isEditorExpanded: false,
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...initialState,

  setCode: (code) =>
    set((state) => ({
      code,
      codeDrafts: {
        ...state.codeDrafts,
        [state.language]: code,
      },
    })),

  setLanguage: (language) =>
    set((state) => ({
      language,
      code: state.codeDrafts[language] ?? languageTemplateMap[language],
    })),

  setExecutionType: (executionType) => set({ executionType }),

  setEditorExpanded: (isEditorExpanded) => set({ isEditorExpanded }),

  toggleEditorExpanded: () =>
    set((state) => ({ isEditorExpanded: !state.isEditorExpanded })),

  addTestCase: () =>
    set((state) => ({
      testCases: [...state.testCases, ''],
      selectedTestCase: state.testCases.length,
    })),

  removeTestCase: (index) =>
    set((state) => {
      if (state.testCases.length <= 1) {
        return state
      }

      const nextTestCases = state.testCases.filter((_, i) => i !== index)
      const nextSelectedTestCase = Math.min(
        state.selectedTestCase,
        nextTestCases.length - 1,
      )

      return {
        testCases: nextTestCases,
        selectedTestCase: nextSelectedTestCase,
      }
    }),

  updateTestCase: (index, value) =>
    set((state) => {
      if (index < 0 || index >= state.testCases.length) {
        return state
      }

      const nextTestCases = state.testCases.slice()
      nextTestCases[index] = value

      return { testCases: nextTestCases }
    }),

  setSelectedTestCase: (index) => set({ selectedTestCase: index }),

  resetWorkspace: () => set(initialState),
}))
