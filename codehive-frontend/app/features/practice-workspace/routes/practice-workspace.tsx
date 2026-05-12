// import { ProtectedRoute } from '~/core/components/ProtectedRoute'
import { PracticeWorkspacePage } from '../pages/PracticeWorkspacePage'

export function meta() {
  return [
    { title: 'Practice - CodeHive' },
    { name: 'description', content: 'CodeHive practice workspace.' },
  ]
}

export default function PracticeWorkspace() {
  // TODO: re-enable ProtectedRoute once auth flow is verified
  // return (
  //   <ProtectedRoute>
  //     <PracticeWorkspacePage />
  //   </ProtectedRoute>
  // )
  return <PracticeWorkspacePage />
}
