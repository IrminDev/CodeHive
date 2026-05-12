import Editor from '@monaco-editor/react'

import { useMonacoConfig } from '../../hooks/useMonacoConfig'
import { useWorkspaceStore } from '../../store/workspace.store'
import { EditorToolbar } from './EditorToolbar'

export function CodeEditor() {
  const code = useWorkspaceStore((state) => state.code)
  const setCode = useWorkspaceStore((state) => state.setCode)

  const { options, monacoLanguage } = useMonacoConfig()

  return (
    <section className="flex h-full min-h-0 flex-col">
      <EditorToolbar />
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={monacoLanguage}
          value={code}
          options={options}
          onChange={(value) => setCode(value ?? '')}
        />
      </div>
    </section>
  )
}
