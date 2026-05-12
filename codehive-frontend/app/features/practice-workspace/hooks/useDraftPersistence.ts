import { useEffect } from 'react'

import { buildDraftSaveRequest } from '../services/draft.service'
import { useWorkspaceStore } from '../store/workspace.store'

function logDraftSaveRequest(payload: unknown) {
  console.groupCollapsed('DraftSaveRequest (beforeunload)')
  console.log(payload)
  console.groupEnd()
}

export function useDraftPersistence() {
  useEffect(() => {
    const handler = () => {
      const state = useWorkspaceStore.getState()

      const payload = buildDraftSaveRequest({
        lastLanguage: state.language,
        codeDrafts: state.codeDrafts,
      })

      logDraftSaveRequest(payload)
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])
}
