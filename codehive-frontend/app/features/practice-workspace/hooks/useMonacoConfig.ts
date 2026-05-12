import { useMemo } from 'react'
import type { editor } from 'monaco-editor'

import { monacoLanguageMap } from '../data'
import { useWorkspaceStore } from '../store/workspace.store'

export function useMonacoConfig() {
  const language = useWorkspaceStore((state) => state.language)

  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      fontSize: 14,
      minimap: { enabled: true },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontLigatures: true,
      smoothScrolling: true,
    }),
    [],
  )

  return {
    options,
    monacoLanguage: monacoLanguageMap[language],
  }
}
