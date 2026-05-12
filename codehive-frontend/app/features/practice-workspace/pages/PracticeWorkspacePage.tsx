import { CodeEditor } from '../components/editor/CodeEditor'
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout'
import { ProblemDescription } from '../components/problem/ProblemDescription'
import { TestCasePanel } from '../components/testcase/TestCasePanel'
import { useDraftPersistence } from '../hooks/useDraftPersistence'

export function PracticeWorkspacePage() {
  useDraftPersistence()

  return (
    <div className="h-screen bg-background text-foreground">
      <WorkspaceLayout>
        <ProblemDescription />
        <CodeEditor />
        <TestCasePanel />
      </WorkspaceLayout>
    </div>
  )
}
