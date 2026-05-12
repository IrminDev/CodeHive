import { Separator } from '~/shared/components/ui/Separator'

import { mockProblem } from '../../data'
import { ConstraintsSection } from './ConstraintsSection'
import { ExamplesSection } from './ExamplesSection'
import { TagsSection } from './TagsSection'

export function ProblemDescription() {
  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="border-b bg-background px-4 py-3">
        <h2 className="text-base font-semibold leading-6">{mockProblem.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{mockProblem.subtitle}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">Problem Statement</h3>
            <Separator className="flex-1" />
          </div>
          <p className="text-sm text-muted-foreground">{mockProblem.statement}</p>
        </section>

        <div className="my-6" />

        <ExamplesSection examples={mockProblem.examples} />

        <div className="my-6" />

        <ConstraintsSection constraints={mockProblem.constraints} />

        <div className="my-6" />

        <TagsSection tags={mockProblem.tags} />
      </div>
    </aside>
  )
}
