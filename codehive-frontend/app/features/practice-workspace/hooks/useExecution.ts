import { useCallback } from 'react'

import { buildExecutionRequest } from '../services/execution.service'
import { useWorkspaceStore } from '../store/workspace.store'
import { ExecutionType } from '../types/execution.types'

function logExecutionRequest(label: string, payload: unknown) {
  console.groupCollapsed(label)
  console.log(payload)
  console.groupEnd()
}

export function useExecution() {
  const code = useWorkspaceStore((state) => state.code)
  const language = useWorkspaceStore((state) => state.language)
  const testCases = useWorkspaceStore((state) => state.testCases)
  const setExecutionType = useWorkspaceStore((state) => state.setExecutionType)

  const run = useCallback(() => {
    const executionType = ExecutionType.PRACTICA
    setExecutionType(executionType)

    const payload = buildExecutionRequest({
      code,
      language,
      testCases,
      executionType,
    })

    logExecutionRequest('ExecutionRequest (PRACTICA)', payload)
  }, [code, language, setExecutionType, testCases])

  const submit = useCallback(() => {
    const executionType = ExecutionType.DEFINITIVO
    setExecutionType(executionType)

    const payload = buildExecutionRequest({
      code,
      language,
      testCases,
      executionType,
    })

    logExecutionRequest('ExecutionRequest (DEFINITIVO)', payload)
  }, [code, language, setExecutionType, testCases])

  return { run, submit }
}
