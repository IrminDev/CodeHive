import { Link } from 'react-router'
import { Code2, ArrowLeft } from 'lucide-react'

export function WorkspaceHeader() {
  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Code2 className="h-4 w-4" />
          CodeHive
        </div>
      </div>
    </header>
  )
}
