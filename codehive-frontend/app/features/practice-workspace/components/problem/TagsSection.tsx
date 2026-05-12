import { Badge } from '~/shared/components/ui/Badge'
import { Separator } from '~/shared/components/ui/Separator'

type TagsSectionProps = {
  tags: string[]
}

export function TagsSection({ tags }: TagsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">Tags</h3>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </section>
  )
}
