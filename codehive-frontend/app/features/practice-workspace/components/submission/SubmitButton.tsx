import { Send } from 'lucide-react'

import { Button } from '~/shared/components/ui/Button'

type SubmitButtonProps = {
  onSubmit: () => void
}

export function SubmitButton({ onSubmit }: SubmitButtonProps) {
  return (
    <Button onClick={onSubmit}>
      <Send className="h-4 w-4" />
      Submit
    </Button>
  )
}
