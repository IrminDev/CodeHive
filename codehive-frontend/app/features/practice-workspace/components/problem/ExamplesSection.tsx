import { Separator } from '~/shared/components/ui/Separator'

type ExampleItem = {
  title: string
  input: string
  output: string
}

type ExamplesSectionProps = {
  examples: ExampleItem[]
}

export function ExamplesSection({ examples }: ExamplesSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">Examples</h3>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-3">
        {examples.map((example) => (
          <div key={example.title} className="rounded-lg border bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground">{example.title}</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="font-medium">Input:</span> {example.input}
              </p>
              <p>
                <span className="font-medium">Output:</span> {example.output}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
