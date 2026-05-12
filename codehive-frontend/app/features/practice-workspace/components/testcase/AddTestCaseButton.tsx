import { Plus } from 'lucide-react'

import { Button } from '~/shared/components/ui/Button'

type AddTestCaseButtonProps = {
  onAdd: () => void
}

export function AddTestCaseButton({ onAdd }: AddTestCaseButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onAdd}>
      <Plus className="h-4 w-4" />
      Add
    </Button>
  )
}
