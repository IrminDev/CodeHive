import { Maximize2, Minimize2 } from 'lucide-react'

import { Button } from '~/shared/components/ui/Button'
import { useExecution } from '../../hooks/useExecution'
import { useWorkspaceStore } from '../../store/workspace.store'
import { RunButton } from '../submission/RunButton'
import { SubmitButton } from '../submission/SubmitButton'
import { LanguageSelector } from './LanguageSelector'

export function EditorToolbar() {
  const { run, submit } = useExecution()
  const isEditorExpanded = useWorkspaceStore((state) => state.isEditorExpanded)
  const toggleEditorExpanded = useWorkspaceStore(
    (state) => state.toggleEditorExpanded,
  )

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex items-center gap-3">
        <LanguageSelector />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleEditorExpanded}
          aria-label={isEditorExpanded ? 'Minimize editor' : 'Expand editor'}
          title={isEditorExpanded ? 'Minimize editor' : 'Expand editor'}
        >
          {isEditorExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        <RunButton onRun={run} />
        <SubmitButton onSubmit={submit} />
      </div>
    </div>
  )
}
