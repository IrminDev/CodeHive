import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/shared/components/ui/Tabs'

import { TestCaseTabs } from './TestCaseTabs'

export function TestCasePanel() {
  return (
    <section className="flex h-full min-h-0 flex-col bg-background">
      <Tabs defaultValue="testcases" className="flex h-full min-h-0 flex-col">
        <div className="border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="testcases">Test Cases</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <TabsContent value="testcases" className="mt-0">
            <TestCaseTabs />
          </TabsContent>

          <TabsContent value="console" className="mt-0">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                In this phase there is no real execution. When you press Run or
                Submit, the payload is printed in the browser DevTools console.
              </p>
              <p>
                Open: <span className="text-foreground">F12 → Console</span>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <p className="text-sm text-muted-foreground">
              Results will appear here once the real execution backend is integrated.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  )
}
