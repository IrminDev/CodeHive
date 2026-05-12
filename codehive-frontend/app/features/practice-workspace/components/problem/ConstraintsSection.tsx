import { Separator } from '~/shared/components/ui/Separator'

type ConstraintsSectionProps = {
  constraints: string[]
}

export function ConstraintsSection({ constraints }: ConstraintsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">Constraints</h3>
        <Separator className="flex-1" />
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {constraints.map((constraint) => (
          <li key={constraint}>{constraint}</li>
        ))}
      </ul>
    </section>
  )
}
