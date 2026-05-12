import { Trash2 } from 'lucide-react'

import { Button } from '~/shared/components/ui/Button'
import { Tabs, TabsList, TabsTrigger } from '~/shared/components/ui/Tabs'

import { useWorkspaceStore } from '../../store/workspace.store'
import { AddTestCaseButton } from './AddTestCaseButton'
import { TestCaseEditor } from './TestCaseEditor'

export function TestCaseTabs() {
  const testCases = useWorkspaceStore((state) => state.testCases)
  const selectedTestCase = useWorkspaceStore((state) => state.selectedTestCase)
  const setSelectedTestCase = useWorkspaceStore(
    (state) => state.setSelectedTestCase,
  )
  const addTestCase = useWorkspaceStore((state) => state.addTestCase)
  const removeTestCase = useWorkspaceStore((state) => state.removeTestCase)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Tabs
          value={String(selectedTestCase)}
          onValueChange={(value) => setSelectedTestCase(Number(value))}
          className="min-w-0 flex-1"
        >
          <TabsList className="w-full justify-start gap-1 overflow-x-auto">
            {testCases.map((_, index) => (
              <TabsTrigger key={index} value={String(index)}>
                Case {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <AddTestCaseButton onAdd={addTestCase} />
          <Button
            variant="outline"
            size="sm"
            disabled={testCases.length <= 1}
            onClick={() => removeTestCase(selectedTestCase)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>

      <TestCaseEditor />
    </div>
  )
}
