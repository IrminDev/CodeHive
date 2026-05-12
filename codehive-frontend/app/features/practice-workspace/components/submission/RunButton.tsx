import { Play } from 'lucide-react'

import { Button } from '~/shared/components/ui/Button'

type RunButtonProps = {
  onRun: () => void
}

export function RunButton({ onRun }: RunButtonProps) {
  return (
    <Button variant="secondary" onClick={onRun}>
      <Play className="h-4 w-4" />
      Run
    </Button>
  )
}
