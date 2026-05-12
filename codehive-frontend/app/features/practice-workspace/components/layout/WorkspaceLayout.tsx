import * as React from 'react'

import { ResizablePanels } from './ResizablePanels'
import { WorkspaceHeader } from './WorkspaceHeader'

type WorkspaceLayoutProps = {
  children: React.ReactNode
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const panels = React.Children.toArray(children)

  return (
    <div className="flex h-full flex-col">
      <WorkspaceHeader />
      <div className="min-h-0 flex-1">
        <ResizablePanels
          left={panels[0] ?? null}
          right={panels[1] ?? null}
          bottom={panels[2] ?? null}
        />
      </div>
    </div>
  )
}
