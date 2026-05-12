import type { ReactNode } from 'react'
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels'

import { cn } from '~/shared/lib/utils'
import { useWorkspaceStore } from '../../store/workspace.store'

type ResizablePanelsProps = {
  left: ReactNode
  right: ReactNode
  bottom: ReactNode
}

function ResizeHandle({ direction }: { direction: 'horizontal' | 'vertical' }) {
  return (
    <PanelResizeHandle
      className={cn(
        'bg-border',
        direction === 'horizontal'
          ? 'h-full w-px hover:bg-ring'
          : 'h-px w-full hover:bg-ring',
      )}
    />
  )
}

export function ResizablePanels({ left, right, bottom }: ResizablePanelsProps) {
  const isEditorExpanded = useWorkspaceStore((state) => state.isEditorExpanded)

  if (isEditorExpanded) {
    return (
      <PanelGroup orientation="vertical" className="h-full">
        <Panel defaultSize={70} minSize={30} className="min-h-0 min-w-0">
          {right}
        </Panel>
        <ResizeHandle direction="vertical" />
        <Panel defaultSize={30} minSize={15} className="min-h-0 min-w-0">
          {bottom}
        </Panel>
      </PanelGroup>
    )
  }

  return (
    <PanelGroup orientation="horizontal" className="h-full">
      <Panel defaultSize={35} minSize={20} className="min-h-0 min-w-0">
        {left}
      </Panel>
      <ResizeHandle direction="horizontal" />
      <Panel defaultSize={65} minSize={30} className="min-h-0 min-w-0">
        <PanelGroup orientation="vertical" className="h-full">
          <Panel defaultSize={70} minSize={30} className="min-h-0 min-w-0">
            {right}
          </Panel>
          <ResizeHandle direction="vertical" />
          <Panel defaultSize={30} minSize={15} className="min-h-0 min-w-0">
            {bottom}
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  )
}
