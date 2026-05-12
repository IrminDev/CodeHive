import { Textarea } from '~/shared/components/ui/Textarea'

import { useWorkspaceStore } from '../../store/workspace.store'

export function TestCaseEditor() {
  const selectedTestCase = useWorkspaceStore((state) => state.selectedTestCase)
  const testCases = useWorkspaceStore((state) => state.testCases)
  const updateTestCase = useWorkspaceStore((state) => state.updateTestCase)

  const value = testCases[selectedTestCase] ?? ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Input</p>
        <p className="text-xs text-muted-foreground">Case {selectedTestCase + 1}</p>
      </div>

      <Textarea
        value={value}
        onChange={(event) =>
          updateTestCase(selectedTestCase, event.currentTarget.value)
        }
        placeholder="Type your test case input here"
        className="min-h-[120px] font-mono"
      />
    </div>
  )
}
